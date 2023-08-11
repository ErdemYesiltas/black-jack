import { GetValue } from './GetValue';

export function Pad(config?: {
    start?: number;
    stop?: number;
    prefix?: string;
    suffix?: string;
    pad?: number;
}): string[] {
    const inLineStrings: string[] = [];

    if (config === undefined || config === null) { config = {}; }

    config.prefix = GetValue(config, 'prefix', '');
    config.suffix = GetValue(config, 'suffix', '');
    config.pad = GetValue(config, 'pad', 5);
    config.start = GetValue(config, 'start', 0);
    config.stop = GetValue(config, 'stop', 0);

    if (config.start <= config.stop) {
        for (let i = config.start; i <= config.stop; i++) {
            let inLine = config.prefix;
            const padDiff = (config.pad - String(i).length);

            if (padDiff > 0) {
                for (let dIndex = 0; dIndex < padDiff; dIndex++) {
                    inLine = inLine.concat('0');
                }
            }
            inLine += String(i);
            inLine += config.suffix;
            inLineStrings.push(inLine);
        }
    }
    else {
        for (let i = config.start; i >= config.stop; i--) {
            let inLine = config.prefix;
            const padDiff = (config.pad - String(i).length);

            if (padDiff > 0) {
                for (let dIndex = 0; dIndex < padDiff; dIndex++) {
                    inLine = inLine.concat('0');
                }
            }
            inLine += String(i);
            inLine += config.suffix;
            inLineStrings.push(inLine);
        }
    }

    return inLineStrings;
}
