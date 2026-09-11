[![Mentioned in Awesome-Selfhosted](https://awesome.re/mentioned-badge.svg)](https://github.com/Kickball/awesome-selfhosted#personal-dashboards)
# simple-dash

Try the Demo here: https://wiesner-philipp.github.io/simple-dash/
Config generator: https://wiesner-philipp.github.io/simple-dash/generator.html

A simple, fully responsive Dashboard to forward to the services of your choice! Ideal for Desktop and mobile usage!
Add all of your services, whether you host them yourself or not and display them as neat Icons from the FontAwesome libary.
simple-dash is made to be as simple and minimalistic as possible. (The goal was to create a dashboard even my mom could use!) :)
Based on: https://github.com/thetomester13/homepage

This project uses:
- Font Awesome 7
- Trianglify

## Screenshots
![Homepage Desktop](example_img/homepage-desktop.png?raw=true)
![Homepage Mobile](example_img/homepage-mobile.png?raw=true)

## To Use
Copy the config.sample.json file and rename to config.json. Be sure to update the fields as you see appropriate.

## Configure Homepage
Prefer a visual editor? Open `generator.html` (in your browser, or hosted alongside the rest of the site on GitHub Pages) to build your config with a live preview, search Font Awesome icons by name, and download the resulting `config.json`.

- 'items' => The menu will scale to the amount of items you want to display. Insert any link you'd like, or {{cur}} for the current URL of the page. Browse icons at [Font Awesome](https://fontawesome.com/search?ic=free) and use the class shown there, e.g. `fa-solid fa-house` or `fa-brands fa-github`.
- 'showLabels' => Optional, defaults to `true`. Set to `false` to hide the text labels under each icon.
- 'background' => Optional. A URL or path (relative to config.json) to a custom background image, e.g. `"common/backgrounds/my-wallpaper.jpg"`. Leave empty (or omit it) to use the generated triangulated background instead. If the image fails to load, simple-dash falls back to the generated background automatically.
