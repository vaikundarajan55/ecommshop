// src/utils/networkIp.js
// This computer's LAN address (e.g. 192.168.1.103) - used instead of 127.0.0.1 / ::1
// when the website is opened on the same machine that runs the server
const os = require('os');

// Adapters created by VMs / Docker / WSL - never the real network
const VIRTUAL = /vethernet|virtualbox|vmware|docker|wsl|hyper-v|loopback|tailscale|zerotier/i;

const getNetworkIp = () => {
  const candidates = [];
  for (const [name, addrs] of Object.entries(os.networkInterfaces())) {
    for (const a of addrs || []) {
      if (a.internal || (a.family !== 'IPv4' && a.family !== 4)) continue;
      if (a.address.startsWith('169.254.')) continue; // no DHCP lease
      candidates.push({ name, address: a.address });
    }
  }
  return (candidates.find((c) => !VIRTUAL.test(c.name)) || candidates[0])?.address || '127.0.0.1';
};

const isLoopback = (ip) => ip === '::1' || ip === 'localhost' || /^127\./.test(ip);

module.exports = { getNetworkIp, isLoopback };
