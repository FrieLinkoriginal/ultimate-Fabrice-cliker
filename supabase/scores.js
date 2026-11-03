/*
 * Client navigateur Supabase pour le classement.
 * La clé configurée ici doit être une clé publique/Publishable, jamais service_role.
 */
(function (global) {
  "use strict";

  var projectUrl = "";
  var publicKey = "";

  function endpoint() {
    if (!projectUrl || !publicKey) {
      throw new Error("Configure Supabase : URL du projet et clé publique manquantes.");
    }
    return projectUrl + "/rest/v1/scores";
  }

  function headers(extra) {
    var result = {
      apikey: publicKey,
      Authorization: "Bearer " + publicKey,
      "Content-Type": "application/json"
    };
    Object.keys(extra || {}).forEach(function (key) {
      result[key] = extra[key];
    });
    return result;
  }

  function errorFrom(response) {
    return response.clone().json().catch(function () {
      return {};
    }).then(function (body) {
      throw new Error(
        (body && (body.message || body.details || body.hint)) ||
          "Erreur Supabase (" + response.status + ")"
      );
    });
  }

  global.OnlineScores = {
    configure: function (url, key) {
      projectUrl = String(url || "").trim().replace(/\/+$/, "");
      projectUrl = projectUrl.replace(/\/rest\/v1$/i, "");
      publicKey = String(key || "").trim();

      if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(projectUrl)) {
        throw new Error("L'URL Supabase doit être de la forme https://xxxxx.supabase.co");
      }
      if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(publicKey)) {
        throw new Error("Une clé publique Supabase Publishable est requise.");
      }
    },

    load: function () {
      var url = endpoint() +
        "?select=id,name,score,created_at&order=score.desc,created_at.asc&limit=100";
      return fetch(url, {
        method: "GET",
        headers: headers(),
        cache: "no-store"
      }).then(function (response) {
        if (!response.ok) return errorFrom(response);
        return response.json();
      }).then(function (rows) {
        if (!Array.isArray(rows)) {
          throw new Error("Supabase a renvoyé un classement invalide.");
        }
        return rows.map(function (row) {
          return {
            id: row.id,
            name: row.name,
            s: Number(row.score),
            t: row.created_at
          };
        });
      });
    },

    submit: function (name, score) {
      var cleanName = String(name || "").trim().replace(/\s+/g, " ");
      if (!cleanName || cleanName.length > 40 || cleanName.toLowerCase() === "fabrice") {
        return Promise.reject(new Error("Nom invalide."));
      }
      if (!Number.isInteger(score) || score < 0 || score > 1000000) {
        return Promise.reject(new Error("Score invalide."));
      }

      return fetch(endpoint(), {
        method: "POST",
        headers: headers({ Prefer: "return=representation" }),
        body: JSON.stringify({ name: cleanName, score: score })
      }).then(function (response) {
        if (!response.ok) return errorFrom(response);
        return response.json();
      }).then(function (rows) {
        var row = rows && rows[0];
        if (!row) {
          throw new Error("Supabase n'a pas renvoyé le score enregistré.");
        }
        return { id: row.id, name: row.name, s: Number(row.score), t: row.created_at };
      });
    }
  };
}(window));
