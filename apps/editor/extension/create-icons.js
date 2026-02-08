const fs = require('fs');
const path = require('path');

// Pre-generated base64 PNG icons (blue square with white T)
// These were created with a proper PNG encoder

const icons = {
  // 16x16 blue square with T
  16: 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAhElEQVR4AWMY/OD/f4b/DAz/GRgY/jMwMPxnYGD8z8AA5TPBxJgQfKIaGBi4GBgY1jIwMLAwMDC8YGBg+M/AwHifgYHhLQMDw38GBsb/SAZwQgV3MzAwcEMFnzEwMLxgYGC4CxO4B+X/Q9ZARAPvGRgYfkP5nAwMDDwwzRAD0MITaCAjLgAA+HofEYO1v+8AAAAASUVORK5CYII=',

  // 48x48 blue square with T
  48: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAA5ElEQVR4Ae2ZQQqEMBRDb93/0npSoYgiJhKhOPhhhkJ3Ty0mVLu+xYiIiIiIiIiIiIiIiBxhB94p9sYCfFPsjQX4pVhVwK+KNdpWFaBWIAu4rNi/3+cOdFWxp0Ct2FXwrHrHAkIAr5Y4FhAFvFliW0AU8GoJYwFRwKsljAVEAa+WMBYQBbxawlhAFPBqCWMBUcCrJYwFRAGvljAWEAW8WsJYQBTwaoljAVHAqyWOBUQBr5Y4FhAF/KpYdQFRwD2w9v2oA2GZYo0FRAGbYo0FRAGbYl8XEAWsijUa3sGvil0E7z9Ux0u5KFoAAAAASUVORK5CYII=',

  // 128x128 blue square with T
  128: 'iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAACBElEQVR4Ae3dMQ7CMBAFUOP7HxoOgoQQIgkTJUIU/Jcmsnf9tuvM8y9EREREREREREREREREDuEB/FLshwuwKvZDLsCq2A/FKgtYFfuhuGMBu2I/FDcsYFfsh+KGBeyK/VDcsIBdsR+KGxawK/ZDccMCdsV+KG5YwK7YD8UNC9gV+6G4YQG7Yj8UNyxgV+yH4oYF7Ir9UNywgF2xH4obFrAr9kNxwwJ2xX4obljArtgPxQ0L2BX7obhhAbtif4oFrIr9KRawKvZDcccCdsV+KO5YwK7YD8UdC9gV+6G4YwG7Yj8Udyxgd+R7yw0L2B35vvMNC9gd+c6lA3DkO5kOwJHvbDoAR76T6QAcWeyXBwAR6fQduwJXXnvsdAWufPbU6Qrc+ey50xW489lzpytw57PnTlfgzmfPna7Anc+eO12BO589d7oCdz577nQF7nz23OkK3PnsudMVuPPZc6crcOez505X4M5nz52uwJ3PnjtdgTufPXe6Anc+e+50Be589tzpCtz57LnTFbjz2XOnK3Dns+dOV+DOZ8+drsCdz547XYE7nz13ugJ3PnvudAXufPbc6Qrc+ey50xW489lzpytw57PnTlfgzmfPna7Anc+eO12BO589d7oCdz577nQF7nz23OkK3PnsudMVuPPZc6crcOezp05X4OvL/VDcsIBVsT/FAtyK/Sme/wH+ATJdZnfPagAAAABJRU5ErkJggg=='
};

const iconsDir = path.join(__dirname, 'icons');

// Write icons
Object.entries(icons).forEach(([size, base64]) => {
  const filePath = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
  console.log(`Created icon${size}.png`);
});

console.log('Done! Icons created successfully.');
