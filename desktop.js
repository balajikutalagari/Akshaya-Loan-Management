/** @typedef {import('pear-interface')} */ /* global Pear */
import Runtime from 'pear-electron'
import Bridge from 'pear-bridge'

// Initialize bridge for IPC communication
const bridge = new Bridge()
await bridge.ready()

// Start the Electron runtime
const runtime = new Runtime()
const pipe = await runtime.start({ bridge })

// Handle app closure
pipe.on('close', () => Pear.exit())

// Log that the desktop app has started
console.log('Akshaya Loan Management System - Desktop App Started')