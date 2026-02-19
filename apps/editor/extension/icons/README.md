# Extension Icons

To complete the extension, add PNG icon files:
- icon16.png (16x16 pixels)
- icon48.png (48x48 pixels)
- icon128.png (128x128 pixels)

Recommended: Use a simple "T" logo on a blue (#3b82f6) background.

For quick testing, you can:
1. Use any online icon generator
2. Create a simple 16x16, 48x48, and 128x128 PNG with the letter "T"
3. Or use a tool like ImageMagick:

   convert -size 16x16 xc:#3b82f6 -fill white -font Arial -pointsize 12 -gravity center -annotate 0 "T" icon16.png
   convert -size 48x48 xc:#3b82f6 -fill white -font Arial -pointsize 36 -gravity center -annotate 0 "T" icon48.png
   convert -size 128x128 xc:#3b82f6 -fill white -font Arial -pointsize 96 -gravity center -annotate 0 "T" icon128.png
