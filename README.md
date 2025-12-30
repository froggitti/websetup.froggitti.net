# websetup.froggitti.net
https://websetup.froggitti.net source code.<br>
Thanks to [kercre123](https://www.github.com/kercre123) for providing the original files for https://websetup.froggitti.net.

# How to run?
Install [node.js](https://nodejs.org/en/download).

Install the vector-web-setup module by running `npm install vector-web-setup`.

Forward TCP port 8000 (or whatever port you choose to run it on) on your router.

Change [line 160 in /rts-js/main.js](https://github.com/froggitti/websetup.froggitti.net/blob/master/rts-js/main.js#L160) to your website URL.

Change [line 1017 in /site/js/rts.js](https://github.com/froggitti/websetup.froggitti.net/blob/master/site/js/rts.js#L1017) to your website URL.

Change [line 1077 in /site/js/rts.js](https://github.com/froggitti/websetup.froggitti.net/blob/master/site/js/rts.js#L1077) to your website URL.

Configure the program by running `node vector-web-setup.js configure`.

Run the program by running `node vector-web-setup.js serve`.

# How to make this internet accessible?

Forward TCP port 80 and port 443 on your router.

Set up a reverse proxy. I use nginx for this.

Basic nginx reverse proxy configuration (replace websetup.silly.net with your website URL):

```
server {
        listen       443 ssl;
        server_name  websetup.silly.net;

        ssl_certificate /etc/letsencrypt/live/websetup.silly.net/fullchain.pem; 
        ssl_certificate_key /etc/letsencrypt/live/websetup.silly.net/privkey.pem; 

        ssl_session_cache    shared:SSL:1m;
        ssl_session_timeout  5m;

        ssl_ciphers  HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers  on;

        location / {
            proxy_pass http://localhost:8000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

        }
}
```

Use [certbot](https://certbot.eff.org/) to secure your website with HTTPS (Vector web setup needs HTTPS for web bluetooth to work).
