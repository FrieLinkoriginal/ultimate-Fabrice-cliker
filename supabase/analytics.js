(function (global) {
  "use strict";

  var projectUrl = "";
  var publicKey = "";
  var started = false;

  function createId() {
    var crypto = global.crypto;
    if (crypto && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }

    var bytes = new Uint8Array(16);
    if (crypto && typeof crypto.getRandomValues === "function") {
      crypto.getRandomValues(bytes);
    } else {
      for (var i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    var hex = Array.prototype.map.call(bytes, function (byte) {
      return byte.toString(16).padStart(2, "0");
    }).join("");
    return hex.slice(0, 8) + "-" + hex.slice(8, 12) + "-" + hex.slice(12, 16) +
      "-" + hex.slice(16, 20) + "-" + hex.slice(20);
  }

  function storedId(storageName, key) {
    try {
      var storage = global[storageName];
      var id = storage.getItem(key);
      if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        return id;
      }
      id = createId();
      storage.setItem(key, id);
      return id;
    } catch (error) {
      console.warn("Le stockage local est indisponible : les statistiques compteront cette visite séparément.", error);
      return createId();
    }
  }

  function deviceType() {
    if (global.navigator.userAgentData && typeof global.navigator.userAgentData.mobile === "boolean") {
      return global.navigator.userAgentData.mobile ? "mobile" : "desktop";
    }
    return global.matchMedia && global.matchMedia("(max-width: 900px)").matches ? "mobile" : "desktop";
  }

  global.SiteAnalytics = {
    configure: function (url, key) {
      projectUrl = String(url || "").trim().replace(/\/+$/, "").replace(/\/rest\/v1$/i, "");
      publicKey = String(key || "").trim();
      if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(projectUrl)) {
        throw new Error("L'URL Supabase doit être de la forme https://xxxxx.supabase.co");
      }
      if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(publicKey)) {
        throw new Error("Une clé publique Supabase Publishable est requise.");
      }
    },

    start: function () {
      if (started) return;
      if (!projectUrl || !publicKey) {
        throw new Error("Configure Supabase avant de démarrer les statistiques.");
      }
      started = true;

      var visitorId = storedId("localStorage", "fabrice-site-visitor-id");
      var visitId = storedId("sessionStorage", "fabrice-site-visit-id");
      var endpoint = projectUrl + "/rest/v1/rpc/record_site_visit";
      var queuedSeconds = 0;
      var sending = false;
      var checkpointAt = Date.now();
      var remainderMs = 0;

      function accrueVisibleTime() {
        var now = Date.now();
        if (document.visibilityState === "visible") {
          remainderMs += Math.max(0, now - checkpointAt);
          var seconds = Math.floor(remainderMs / 1000);
          remainderMs -= seconds * 1000;
          queuedSeconds += seconds;
        }
        checkpointAt = now;
      }

      function flush(keepalive) {
        if (sending) return;
        var seconds = Math.min(60, queuedSeconds);
        queuedSeconds -= seconds;
        sending = true;
        var failed = false;
        fetch(endpoint, {
          method: "POST",
          headers: {
            apikey: publicKey,
            Authorization: "Bearer " + publicKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            p_visit_id: visitId,
            p_visitor_id: visitorId,
            p_device_type: deviceType(),
            p_duration_seconds: seconds
          }),
          keepalive: !!keepalive
        }).then(function (response) {
          if (!response.ok) {
            throw new Error("Erreur Supabase pour les statistiques (" + response.status + ").");
          }
        }).catch(function (error) {
          failed = true;
          queuedSeconds += seconds;
          console.error("Impossible d'enregistrer les statistiques de visite.", error);
        }).then(function () {
          sending = false;
          if (!failed && queuedSeconds > 0) {
            setTimeout(function () {
              flush(document.visibilityState === "hidden");
            }, 0);
          }
        });
      }

      flush(false);
      global.setInterval(function () {
        accrueVisibleTime();
        flush(false);
      }, 30000);
      document.addEventListener("visibilitychange", function () {
        accrueVisibleTime();
        if (document.visibilityState === "hidden") flush(true);
      });
      global.addEventListener("pagehide", function () {
        accrueVisibleTime();
        flush(true);
      });
    }
  };
}(window));
