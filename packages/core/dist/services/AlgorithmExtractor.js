"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlgorithmExtractor = void 0;
class AlgorithmExtractor {
    extractH2Section(content, heading) {
        const lines = content.split("\n");
        const targetHeading = `## ${heading}`;
        let inSection = false;
        const sectionContent = [];
        for (const line of lines) {
            if (line.trim() === targetHeading) {
                inSection = true;
                continue;
            }
            if (inSection) {
                if (line.startsWith("## ") || line.startsWith("# ")) {
                    break;
                }
                sectionContent.push(line);
            }
        }
        if (sectionContent.length === 0) {
            return null;
        }
        const content_text = sectionContent.join("\n").trim();
        return content_text || null;
    }
}
exports.AlgorithmExtractor = AlgorithmExtractor;
