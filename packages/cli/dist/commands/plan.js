import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
// PlanningService temporarily removed from core - needs migration
// import { PlanningService } from '@exocortex/core';
// import { NodeFsAdapter } from '../adapters/NodeFsAdapter.js';
// import * as path from 'path';
export function planCommand() {
    const cmd = new Command('today');
    cmd
        .description('Plan task for today')
        .requiredOption('-t, --task <path>', 'Path to task file')
        .option('-r, --root <path>', 'Root directory of vault', process.cwd())
        .action(async () => {
        const spinner = ora('Planning task for today...').start();
        try {
            // TODO: Re-enable after PlanningService migration to core
            spinner.fail('Planning command temporarily disabled during monorepo migration');
            return;
            /*
            const adapter = new NodeFsAdapter(options.root);
            const service = new PlanningService(adapter);
    
            const taskPath = path.relative(options.root, options.task);
            await service.planOnToday(taskPath);
    
            spinner.succeed(chalk.green(`Task planned for today: ${taskPath}`));
            */
        }
        catch (error) {
            spinner.fail(chalk.red(`Failed to plan task: ${error.message}`));
            process.exit(1);
        }
    });
    return cmd;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxhbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb21tYW5kcy9wbGFuLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFDcEMsT0FBTyxLQUFLLE1BQU0sT0FBTyxDQUFDO0FBQzFCLE9BQU8sR0FBRyxNQUFNLEtBQUssQ0FBQztBQUN0QixrRUFBa0U7QUFDbEUscURBQXFEO0FBQ3JELGdFQUFnRTtBQUNoRSxnQ0FBZ0M7QUFFaEMsTUFBTSxVQUFVLFdBQVc7SUFDekIsTUFBTSxHQUFHLEdBQUcsSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFakMsR0FBRztTQUNBLFdBQVcsQ0FBQyxxQkFBcUIsQ0FBQztTQUNsQyxjQUFjLENBQUMsbUJBQW1CLEVBQUUsbUJBQW1CLENBQUM7U0FDeEQsTUFBTSxDQUFDLG1CQUFtQixFQUFFLHlCQUF5QixFQUFFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztTQUNyRSxNQUFNLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDakIsTUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDLDRCQUE0QixDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7UUFFMUQsSUFBSSxDQUFDO1lBQ0gsMERBQTBEO1lBQzFELE9BQU8sQ0FBQyxJQUFJLENBQUMsaUVBQWlFLENBQUMsQ0FBQztZQUNoRixPQUFPO1lBRVA7Ozs7Ozs7O2NBUUU7UUFDSixDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNmLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyx3QkFBeUIsS0FBZSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2xCLENBQUM7SUFDSCxDQUFDLENBQUMsQ0FBQztJQUVMLE9BQU8sR0FBRyxDQUFDO0FBQ2IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbW1hbmQgfSBmcm9tICdjb21tYW5kZXInO1xuaW1wb3J0IGNoYWxrIGZyb20gJ2NoYWxrJztcbmltcG9ydCBvcmEgZnJvbSAnb3JhJztcbi8vIFBsYW5uaW5nU2VydmljZSB0ZW1wb3JhcmlseSByZW1vdmVkIGZyb20gY29yZSAtIG5lZWRzIG1pZ3JhdGlvblxuLy8gaW1wb3J0IHsgUGxhbm5pbmdTZXJ2aWNlIH0gZnJvbSAnQGV4b2NvcnRleC9jb3JlJztcbi8vIGltcG9ydCB7IE5vZGVGc0FkYXB0ZXIgfSBmcm9tICcuLi9hZGFwdGVycy9Ob2RlRnNBZGFwdGVyLmpzJztcbi8vIGltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5cbmV4cG9ydCBmdW5jdGlvbiBwbGFuQ29tbWFuZCgpOiBDb21tYW5kIHtcbiAgY29uc3QgY21kID0gbmV3IENvbW1hbmQoJ3RvZGF5Jyk7XG5cbiAgY21kXG4gICAgLmRlc2NyaXB0aW9uKCdQbGFuIHRhc2sgZm9yIHRvZGF5JylcbiAgICAucmVxdWlyZWRPcHRpb24oJy10LCAtLXRhc2sgPHBhdGg+JywgJ1BhdGggdG8gdGFzayBmaWxlJylcbiAgICAub3B0aW9uKCctciwgLS1yb290IDxwYXRoPicsICdSb290IGRpcmVjdG9yeSBvZiB2YXVsdCcsIHByb2Nlc3MuY3dkKCkpXG4gICAgLmFjdGlvbihhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBzcGlubmVyID0gb3JhKCdQbGFubmluZyB0YXNrIGZvciB0b2RheS4uLicpLnN0YXJ0KCk7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIC8vIFRPRE86IFJlLWVuYWJsZSBhZnRlciBQbGFubmluZ1NlcnZpY2UgbWlncmF0aW9uIHRvIGNvcmVcbiAgICAgICAgc3Bpbm5lci5mYWlsKCdQbGFubmluZyBjb21tYW5kIHRlbXBvcmFyaWx5IGRpc2FibGVkIGR1cmluZyBtb25vcmVwbyBtaWdyYXRpb24nKTtcbiAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIC8qXG4gICAgICAgIGNvbnN0IGFkYXB0ZXIgPSBuZXcgTm9kZUZzQWRhcHRlcihvcHRpb25zLnJvb3QpO1xuICAgICAgICBjb25zdCBzZXJ2aWNlID0gbmV3IFBsYW5uaW5nU2VydmljZShhZGFwdGVyKTtcblxuICAgICAgICBjb25zdCB0YXNrUGF0aCA9IHBhdGgucmVsYXRpdmUob3B0aW9ucy5yb290LCBvcHRpb25zLnRhc2spO1xuICAgICAgICBhd2FpdCBzZXJ2aWNlLnBsYW5PblRvZGF5KHRhc2tQYXRoKTtcblxuICAgICAgICBzcGlubmVyLnN1Y2NlZWQoY2hhbGsuZ3JlZW4oYFRhc2sgcGxhbm5lZCBmb3IgdG9kYXk6ICR7dGFza1BhdGh9YCkpO1xuICAgICAgICAqL1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgc3Bpbm5lci5mYWlsKGNoYWxrLnJlZChgRmFpbGVkIHRvIHBsYW4gdGFzazogJHsoZXJyb3IgYXMgRXJyb3IpLm1lc3NhZ2V9YCkpO1xuICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgcmV0dXJuIGNtZDtcbn1cbiJdfQ==