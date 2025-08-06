# Claude Code Development Guidelines

## ⚠️ CRITICAL: MANDATORY RELEASE PROCESS ⚠️

### ПОСЛЕ КАЖДОГО ИЗМЕНЕНИЯ КОДОВОЙ БАЗЫ:
1. **ОБЯЗАТЕЛЬНО создать релиз на GitHub**
2. **ПРОВЕРИТЬ успешность GitHub Actions**
3. **УБЕДИТЬСЯ в прохождении Quality Gate**
4. **ЗАДАНИЕ СЧИТАЕТСЯ ВЫПОЛНЕННЫМ ТОЛЬКО ПОСЛЕ УСПЕШНОГО РЕЛИЗА**

### After Every Code Change
1. **Run Tests**: Always run `npm test` after making changes
2. **Build the Plugin**: Run `npm run build` to ensure TypeScript compiles
3. **Update Version**: Increment version in:
   - `manifest.json`
   - `package.json`
   - `versions.json`
4. **Update CHANGELOG.md**: Document all changes with proper categorization
5. **Create GitHub Release**: After committing changes, create a release on GitHub with:
   - Tag matching the version (e.g., `0.4.2`)
   - Release notes from CHANGELOG
   - Automated workflow will attach built files

### Testing Requirements
- Every new feature MUST have corresponding tests
- Run all tests after changes: `npm test`
- Achieve 100% test pass rate before releasing
- Use `npm test:coverage` to check test coverage

### Project Structure
- Main plugin code: `main.ts`
- Tests: `tests/` directory
- Build output: `main.js`, `styles.css`, `manifest.json`
- GitHub Actions: `.github/workflows/release.yml` (automated releases)

### Key Commands
```bash
# Development
npm run dev          # Development build with watch
npm run build        # Production build
npm test            # Run all tests
npm test:watch      # Run tests in watch mode
npm test:coverage   # Run tests with coverage report

# Release Process
git add .
git commit -m "feat: description of changes"
git push origin master
# GitHub Actions will automatically create release when pushed to master
```

### Obsidian Plugin Specifics
- Always test in Obsidian after building
- Template folder exclusion: Files in `templateFolderPath` are excluded from dropdowns
- Default ontology: Stored as prefix, converted to fileName when used
- Dynamic properties: Based on selected class and inheritance hierarchy

### Known Issues to Remember
- TypeScript strict mode may cause issues with Obsidian API mocks in tests
- Use `node esbuild.config.mjs production` if TypeScript check fails on test files
- The plugin must be reloaded in Obsidian after building for changes to take effect

### GitHub Release Process - ОБЯЗАТЕЛЬНЫЙ ПРОЦЕСС!
The repository has GitHub Actions configured to automatically create releases when tags are pushed.

**⚠️ КРИТИЧЕСКИ ВАЖНО - ВЫПОЛНЯТЬ ПОСЛЕ КАЖДОГО ИЗМЕНЕНИЯ ⚠️**:
1. Update version in `manifest.json`, `package.json`, and `versions.json`
2. Update CHANGELOG.md with changes
3. Commit and push to master:
   ```bash
   git add .
   git commit -m "feat/fix: description"
   git push origin main
   ```
4. Create and push a version tag to trigger release:
   ```bash
   git tag 0.x.x
   git push origin 0.x.x
   ```
5. GitHub Actions will automatically:
   - Build the plugin
   - Create a release with the built files attached
   - Include `main.js`, `manifest.json`, `styles.css`, and a ZIP file
6. Users can download the release directly from GitHub

**Note**: The release workflow is triggered by tags, not by pushes to master!

## ❌ ЗАДАНИЕ НЕ ВЫПОЛНЕНО, ЕСЛИ:
- Не создан релиз на GitHub
- GitHub Actions завершились с ошибкой
- Quality Gate не пройден
- Релиз не опубликован

## ✅ ЗАДАНИЕ ВЫПОЛНЕНО, КОГДА:
- Код закоммичен и запушен
- Тег версии создан и запушен
- GitHub Actions успешно завершены
- Релиз опубликован на GitHub
- Все файлы (main.js, manifest.json, styles.css) приложены к релизу