FROM nginx:alpine

# no-cache revalidation for the unhashed ES modules — see default.conf for why.
COPY default.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/
COPY src /usr/share/nginx/html/src

EXPOSE 80
