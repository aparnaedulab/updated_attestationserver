module.exports = {
  apps : [{
    name: "guattestation",
    script: '/var/lib/jenkins/workspace/guattestationserver/app.js',
    cwd: "/var/lib/jenkins/workspace/guattestationserver/",
    interpreter: "/root/.nvm/versions/node/16.19.0/bin/node",
    restart_delay: 4000,
  }]
};
