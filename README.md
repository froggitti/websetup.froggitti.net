# websetup.froggitti.net
https://websetup.froggitti.net source code.

# How to run?
Install [node.js](https://nodejs.org/en/download).

Install the vector-web-setup module by running `npm install vector-web-setup`.

Forward port 8000 (or whatever port you choose to run it on) on your router.

Change [line 160 in /rts-js/main.js](https://github.com/froggitti/websetup.froggitti.net/blob/master/rts-js/main.js#L160) to your website URL.

Change [line 1017 in /site/js/rts.js](https://github.com/froggitti/websetup.froggitti.net/blob/master/site/js/rts.js#L1017) to your website URL.

Change [line 1077 in /site/js/rts.js](https://github.com/froggitti/websetup.froggitti.net/blob/master/site/js/rts.js#L1077) to your website URL.

Configure the program by running `node vector-web-setup.js configure`.

Run the program by running `node vector-web-setup.js serve`.
