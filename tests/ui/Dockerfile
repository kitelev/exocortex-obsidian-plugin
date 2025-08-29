# Dockerfile for running Obsidian UI tests
FROM node:18-bullseye

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    xvfb \
    x11vnc \
    fluxbox \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libatspi2.0-0 \
    libx11-6 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libxcb1 \
    libxkbcommon0 \
    libgtk-3-0 \
    libasound2 \
    fonts-liberation \
    libappindicator3-1 \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Install Obsidian (using AppImage)
RUN wget -q https://github.com/obsidianmd/obsidian-releases/releases/download/v1.5.3/Obsidian-1.5.3.AppImage -O /usr/local/bin/obsidian.AppImage && \
    chmod +x /usr/local/bin/obsidian.AppImage && \
    cd /usr/local/bin && \
    ./obsidian.AppImage --appimage-extract && \
    ln -s /usr/local/bin/squashfs-root/AppRun /usr/local/bin/obsidian

# Create test vault directory
RUN mkdir -p /test-vault/.obsidian/plugins/exocortex

# Create test vault with basic structure
RUN mkdir -p /test-vault/02\ Ontology/1\ Exo/exo/Class && \
    mkdir -p /test-vault/02\ Ontology/1\ Exo/exo/Property && \
    mkdir -p /test-vault/02\ Ontology/2\ Custom/ems

# Create some test class files
RUN echo '---\nexo__Instance_class: "[[exo__Class]]"\nrdfs__label: "Asset"\n---\n\n# Asset Class' > "/test-vault/02 Ontology/1 Exo/exo/Class/exo__Asset.md" && \
    echo '---\nexo__Instance_class: "[[exo__Class]]"\nrdfs__label: "Effort"\n---\n\n# Effort Class' > "/test-vault/02 Ontology/2 Custom/ems/ems__Effort.md" && \
    echo '---\nexo__Instance_class: "[[exo__Class]]"\nrdfs__label: "Person"\n---\n\n# Person Class' > "/test-vault/02 Ontology/1 Exo/exo/Class/exo__Person.md"

# Create some test property files
RUN echo '---\nexo__Instance_class: "[[exo__Property]]"\nrdfs__domain: "[[ems__Effort]]"\nrdfs__label: "Title"\nrdfs__range: "string"\nexo__Property_isRequired: true\n---\n\n# Title Property' > "/test-vault/02 Ontology/2 Custom/ems/ems__title.md" && \
    echo '---\nexo__Instance_class: "[[exo__Property]]"\nrdfs__domain: "[[ems__Effort]]"\nrdfs__label: "Status"\nrdfs__range: "string"\nexo__Property_options: ["Not Started", "In Progress", "Complete"]\n---\n\n# Status Property' > "/test-vault/02 Ontology/2 Custom/ems/ems__status.md"

# Create core property files that should be filtered
RUN echo '---\nexo__Instance_class: "[[exo__Property]]"\nrdfs__domain: "[[exo__Asset]]"\nrdfs__label: "Unique ID"\nrdfs__range: "string"\nexo__Property_isRequired: true\n---\n\n# Unique ID Property' > "/test-vault/02 Ontology/1 Exo/exo/Property/exo__Asset_uid.md" && \
    echo '---\nexo__Instance_class: "[[exo__Property]]"\nrdfs__domain: "[[exo__Asset]]"\nrdfs__label: "Defined By"\nrdfs__range: "[[exo__Ontology]]"\nexo__Property_isRequired: true\n---\n\n# Defined By Property' > "/test-vault/02 Ontology/1 Exo/exo/Property/exo__Asset_isDefinedBy.md" && \
    echo '---\nexo__Instance_class: "[[exo__Property]]"\nrdfs__domain: "[[exo__Asset]]"\nrdfs__label: "Instance Class"\nrdfs__range: "[[exo__Class]]"\nexo__Property_isRequired: true\n---\n\n# Instance Class Property' > "/test-vault/02 Ontology/1 Exo/exo/Property/exo__Instance_class.md"

# Enable the plugin in Obsidian config
RUN mkdir -p /test-vault/.obsidian && \
    echo '{"pluginEnabledStatus":{"exocortex":true}}' > /test-vault/.obsidian/community-plugins.json

# Set up working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Install Chrome for WebdriverIO
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
    echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list && \
    apt-get update && \
    apt-get install -y google-chrome-stable --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Install WebdriverIO and dependencies
RUN npm install --save-dev \
    @wdio/cli \
    @wdio/local-runner \
    @wdio/mocha-framework \
    @wdio/spec-reporter \
    @wdio/selenium-standalone-service \
    chromedriver \
    wdio-chromedriver-service

# Create results directory
RUN mkdir -p /app/test-results

# Set Chrome binary location
ENV CHROME_BIN=/usr/bin/google-chrome

# Copy test files (will be mounted as volumes)
# The actual test specs and configs will be mounted from host

CMD ["npm", "run", "wdio"]