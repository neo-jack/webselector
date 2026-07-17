FROM nginx:stable-alpine

RUN curl --version > /dev/null

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY site/index.html /usr/share/nginx/html/AItool/index.html
COPY site/assets/favicon.svg /usr/share/nginx/html/AItool/assets/favicon.svg
COPY site/assets/forest.svg site/assets/demo.mp4 /usr/share/nginx/html/AItool/assets/
COPY site/core/index.js /usr/share/nginx/html/AItool/core/index.js
COPY site/core/dist/selector.js site/core/dist/selector.css /usr/share/nginx/html/AItool/core/dist/

EXPOSE 80

HEALTHCHECK --interval=5s --timeout=5s --start-period=5s --retries=6 \
  CMD for asset in '' core/index.js core/dist/selector.js core/dist/selector.css assets/favicon.svg; do curl --fail --silent --show-error --noproxy '*' --max-time 2 "http://127.0.0.1/AItool/$asset" > /dev/null || exit 1; done

ENTRYPOINT []
CMD ["nginx", "-g", "daemon off;"]
