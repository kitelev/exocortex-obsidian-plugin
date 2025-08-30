/**
 * Basic connection test to verify Obsidian starts and executeObsidian works
 */
describe('Basic Obsidian Connection Test', () => {
  it('should start Obsidian and execute basic command', async () => {
    // Simple test to verify browser.executeObsidian is available
    const result = await browser.executeObsidian(({app}) => {
      return app ? 'Obsidian is running' : 'Obsidian not found';
    });
    
    console.log('Obsidian connection result:', result);
    expect(result).toBe('Obsidian is running');
  });

  it('should have the plugin loaded', async () => {
    const pluginLoaded = await browser.executeObsidian(({app}) => {
      return app.plugins?.enabledPlugins?.has('exocortex') || false;
    });
    
    console.log('Plugin loaded:', pluginLoaded);
    expect(pluginLoaded).toBe(true);
  });
});