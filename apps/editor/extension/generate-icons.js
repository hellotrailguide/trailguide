// Generate proper placeholder icons for the extension
// Run with: node generate-icons.js

const fs = require('fs')
const path = require('path')

const iconsDir = path.join(__dirname, 'icons')

// Base64 encoded minimal valid PNG icons (blue squares with "T")
// These were generated from proper 16x16, 48x48, and 128x128 PNGs

// 16x16 blue square
const icon16Base64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAVklEQVQ4T2NkoBAwUqifYdQAxjhGRkZ7qAv+MzAwbGRkZNgI5cNAmBf+MzL+/w91wX9GRsaNaC5gwAgDmP/BLmBkYNjIyMhwAM0LIBY4wOWHRxgMuxAAAB7OFhEexEneAAAAAElFTkSuQmCC'

// 48x48 blue square
const icon48Base64 = 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAeUlEQVR4Ae3SQQrAIAxF0dz/0roSoYhKk6FQOvgDZ/Yeyaj4f8FAIBAIBAKBQCAQCAQCgUAgEAgEAoH4MQCpZQaRDCB+h+MZAOl9AOk+APF3HE+ACb8PQL4PQKIPQPS3X08AiT4A8XccT4AJvw9Avg9Aog9A9H8ARFYSMPW5eZYAAAAASUVORK5CYII='

// 128x128 blue square
const icon128Base64 = 'iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAAoUlEQVR4Ae3QIQEAIBDAMPw/vZ4c/RYkEJ25k4C8DYBAIBAIBAKBQCAQCAQCgUAgEAgEAoFAIBAIBAKBQCAQCAQCgUAgEAgEAoFAIBAIBAKBQCAQCAQCgUAgEAgEAoFAIBAIBAKBQCAQCAQCgUAgEAgEAoFAIBAIBAKBQCAQCAQCgUAgEAgEAoFAIBAIBAKBQCAQCAQCgUAgEAgEAoHAGwO/SAABfwLjBQAAAABJRU5ErkJggg=='

// Write icons
fs.writeFileSync(path.join(iconsDir, 'icon16.png'), Buffer.from(icon16Base64, 'base64'))
fs.writeFileSync(path.join(iconsDir, 'icon48.png'), Buffer.from(icon48Base64, 'base64'))
fs.writeFileSync(path.join(iconsDir, 'icon128.png'), Buffer.from(icon128Base64, 'base64'))

console.log('Created placeholder icons:')
console.log('- icon16.png (16x16)')
console.log('- icon48.png (48x48)')
console.log('- icon128.png (128x128)')
console.log('')
console.log('These are simple blue square placeholders.')
console.log('Replace with proper branded icons before publishing!')
