![](mixfonts.png)

# MixFonts

A Figma plugin let you easy to use different fonts for Latin and CJK characters.

## Installation

- Go to [Figma plugin page](https://www.figma.com/c) and search "MixFonts".
- Download [master.zip](https://github.com/Ashung/mixfonts-figma/archive/master.zip), unzip, get the Figma desktop app and go to Menu > Plugins > Development > New Plugin...,  click file icon to choose the manifest.json file.

## Import / Export Data

Import MixFonts rules from JSON file, and export rules as JSON file for sharing.

The fisrt item in `fonts` array is font for Latin characters, and the second item for CJK characters.

```json
[
  {
    "group": "Android",
    "fonts": [
      {"family":"Roboto","style":"Light"},
      {"family":"Noto Sans CJK SC","style":"Light"}
    ]
  },
  {
    "group": "Android",
    "fonts": [
      {"family":"Roboto","style":"Regular"},
      {"family":"Noto Sans CJK SC","style":"Regular"}
    ]
  },
  {
    "group": "Android",
    "fonts": [
      {"family":"Roboto","style":"Bold"},
      {"family":"Noto Sans CJK SC","style":"Bold"}
    ]
  },
  {
    "group": "iOS",
    "fonts": [
      {"family":"SF Pro Display","style":"Light"},
      {"family":"PingFang SC","style":"Light"}
    ]
  },
  {
    "group": "iOS",
    "fonts": [
      {"family":"SF Pro Display","style":"Regular"},
      {"family":"PingFang SC","style":"Regular"}
    ]
  },
  {
    "group": "iOS",
    "fonts": [
      {"family":"SF Pro Display","style":"Bold"},
      {"family":"PingFang SC","style":"Semibold"}
    ]
  }
]
```

## License

MIT

## Donate

[Buy me a coffee](https://www.buymeacoffee.com/ashung) or donate [$2.00](https://www.paypal.me/ashung/2) [$5.00](https://www.paypal.me/ashung/5) [$10.00](https://www.paypal.me/ashung/10) via PayPal.

[使用支付宝或微信扫码打赏](https://ashung.github.io/donate.html)