#!/bin/sh
cat >/usr/share/nginx/html/runtime-env.js <<EOF
(function (w) {
  w.__env = w.__env || {};
  w.__env.API_URL = "${API_URL}";
  w.__env.GOOGLE_CLIENT_ID = "${GOOGLE_CLIENT_ID}";
  w.__env.GOOGLE_CALLBACK_URL = "${GOOGLE_CALLBACK_URL}";
})(window);
EOF

exec "$@"
