// frontend/src/components/OracleSetupModal.jsx
import { useState } from 'react';
import { Copy, Check, Terminal, ExternalLink, Shield, Server, Cloud, Cpu } from 'lucide-react';
import Modal from './Modal';
import toast from 'react-hot-toast';

export default function OracleSetupModal({ isOpen, onClose }) {
  const [copiedKey, setCopiedKey] = useState(null);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const chrInstallScript = `sudo su
# 1. Download official MikroTik CHR Raw Image (v7.15.2 stable)
wget https://download.mikrotik.com/routeros/7.15.2/chr-7.15.2.img.zip -O chr.img.zip
gunzip -c chr.img.zip > chr.img

# 2. Flash CHR directly to primary boot disk (sda)
echo u > /proc/sysrq-trigger
dd if=chr.img bs=1024 of=/dev/sda

# 3. Force instant reboot into MikroTik RouterOS
echo b > /proc/sysrq-trigger`;

  const securityListRules = [
    { port: '8728 (API)', desc: 'Required for Render billing system backend connection' },
    { port: '8291 (WinBox)', desc: 'For graphical WinBox desktop management' },
    { port: '22 (SSH)', desc: 'For command-line terminal administration' },
    { port: '80 / 443 (WebFig)', desc: 'Optional for web management' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Deploy MikroTik RouterOS on Oracle Cloud Free Tier">
      <div className="space-y-6 text-sm text-slate-700 dark:text-slate-200">
        {/* Step 1: Create Instance */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 font-bold text-slate-900 dark:text-slate-100 text-base">
            <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">1</span>
            <span>Create Oracle Cloud "Always Free" VM</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 pl-8">
            Log into Oracle Cloud Console &rarr; <b>Compute &rarr; Instances &rarr; Create Instance</b>:
          </p>
          <ul className="text-xs space-y-1 pl-12 list-disc text-slate-600 dark:text-slate-300">
            <li><b>Image</b>: Canonical Ubuntu 22.04 or 24.04 (x86_64 AMD VM.Standard.E2.1.Micro)</li>
            <li><b>Networking</b>: Assign a <b>Public IPv4 Address</b></li>
            <li><b>SSH Keys</b>: Save your private key to SSH into the instance</li>
          </ul>
        </div>

        {/* Step 2: Run CHR Installation Script */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 font-bold text-slate-900 dark:text-slate-100 text-base">
            <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">2</span>
            <span>SSH &amp; Run 1-Click MikroTik Flash Script</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 pl-8">
            SSH into your Ubuntu VM (<code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">ssh ubuntu@YOUR_ORACLE_PUBLIC_IP</code>) and paste:
          </p>
          <div className="relative pl-8">
            <pre className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800">
              {chrInstallScript}
            </pre>
            <button
              onClick={() => copyToClipboard(chrInstallScript, 'script')}
              className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition flex items-center space-x-1 text-xs cursor-pointer"
            >
              {copiedKey === 'script' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy Script</span>
            </button>
          </div>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 pl-8 font-medium">
            ⚠️ The SSH session will disconnect immediately. Wait <b>60 seconds</b> for Oracle Cloud to boot into RouterOS.
          </p>
        </div>

        {/* Step 3: Open Ingress Ports */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 font-bold text-slate-900 dark:text-slate-100 text-base">
            <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">3</span>
            <span>Allow Ingress Ports in Oracle Cloud Firewall</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 pl-8">
            In Oracle Console &rarr; <b>Virtual Cloud Networks &rarr; Subnet &rarr; Default Security List</b>, add Ingress Rules:
          </p>
          <div className="pl-8 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {securityListRules.map((rule, idx) => (
              <div key={idx} className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="font-mono font-bold text-xs text-primary">{rule.port}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{rule.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Step 4: Connect to Render Billing */}
        <div className="space-y-2 border-t border-slate-200 dark:border-slate-700 pt-4">
          <div className="flex items-center space-x-2 font-bold text-slate-900 dark:text-slate-100 text-base">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">4</span>
            <span>Add Router in this Dashboard</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 pl-8">
            In our <b>Routers page</b>, click <b>Add Router</b>:
          </p>
          <div className="pl-8 bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-xs space-y-1 font-mono text-emerald-900 dark:text-emerald-300">
            <div><b>Host IP</b>: Your Oracle VM Public IP (e.g. 129.153.x.x)</div>
            <div><b>Port</b>: 8728</div>
            <div><b>Username</b>: admin</div>
            <div><b>Password</b>: (blank / empty initially)</div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

