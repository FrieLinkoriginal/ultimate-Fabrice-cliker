(function (global) {
  "use strict";

  var projectUrl = "";
  var publicKey = "";
  var generatedPlayerId = "";
  var PLAYER_ID_KEY = "fabrice-clicker-achievement-player-id";
  var PLAYER_NAME_KEY = "fabrice-clicker-achievement-player-name";

  function createId() {
    if (global.crypto && typeof global.crypto.randomUUID === "function") {
      return global.crypto.randomUUID();
    }

    var bytes = new Uint8Array(16);
    if (global.crypto && typeof global.crypto.getRandomValues === "function") {
      global.crypto.getRandomValues(bytes);
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

  function rpc(name, body) {
    if (!projectUrl || !publicKey) {
      return Promise.reject(new Error("Configure Supabase avant d'utiliser le classement des succès."));
    }
    return global.fetch(projectUrl + "/rest/v1/rpc/" + name, {
      method: "POST",
      headers: {
        apikey: publicKey,
        Authorization: "Bearer " + publicKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }).then(function (response) {
      return response.text().then(function (text) {
        var result = null;
        try {
          result = text ? JSON.parse(text) : null;
        } catch (error) {
          if (response.ok) throw new Error("Supabase a renvoyé une réponse invalide.");
        }
        if (!response.ok) {
          throw new Error((result && (result.message || result.details || result.hint)) ||
            "Erreur Supabase (" + response.status + ").");
        }
        return result;
      });
    });
  }

  global.AchievementBoard = {
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

    playerId: function () {
      try {
        var id = global.localStorage.getItem(PLAYER_ID_KEY);
        if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
          return id;
        }
        id = createId();
        global.localStorage.setItem(PLAYER_ID_KEY, id);
        return id;
      } catch (error) {
        if (!generatedPlayerId) generatedPlayerId = createId();
        console.warn("Le stockage local est indisponible : le profil des succès ne sera pas conservé.", error);
        return generatedPlayerId;
      }
    },

    storedName: function () {
      try {
        return global.localStorage.getItem(PLAYER_NAME_KEY) || "";
      } catch (error) {
        return "";
      }
    },

    rememberName: function (name) {
      try {
        global.localStorage.setItem(PLAYER_NAME_KEY, name);
      } catch (error) {
        console.warn("Le pseudo ne peut pas être mémorisé sur cet appareil.", error);
      }
    },

    register: function (playerId, username) {
      return rpc("register_achievement_player", {
        p_player_id: playerId,
        p_username: username
      }).then(function (rows) {
        if (!Array.isArray(rows) || !rows[0] || !rows[0].username) {
          throw new Error("Supabase n'a pas renvoyé le profil du joueur.");
        }
        return rows[0];
      }).catch(function (error) {
        if (error.message && error.message.indexOf("achievement_players_username_lower_idx") !== -1) {
          throw new Error("Ce pseudo est déjà utilisé. Choisis-en un autre.");
        }
        throw error;
      });
    },

    sync: function (playerId, achievements) {
      return rpc("save_achievement_progress", {
        p_player_id: playerId,
        p_achievement_ids: achievements
      });
    },

    list: function () {
      return rpc("list_achievement_players", {});
    }
  };
}(window));
