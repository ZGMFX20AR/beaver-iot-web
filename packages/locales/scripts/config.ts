import * as path from 'path';
import { parseEnvVariables } from '@milesight/scripts';

/**
 * The root path of the project
 */
export const projectRoot = path.join(__dirname, '../../../');

/**
 * The root path of the package
 */
export const pkgRoot = path.join(__dirname, '../');

/**
 * The environment variables of the project
 */
export const {
    PHRASE_PROJECT_ID,
    PHRASE_ACCESS_TOKEN,
    PHRASE_WX_WORK_KEY,
    PHRASE_JOB_REVIEWERS,
    PHRASE_JOB_TRANSLATORS,
    PHRASE_WX_WORK_MENTIONED_USERS,
} = parseEnvVariables([
    path.join(projectRoot, '.env'),
    path.join(projectRoot, '.env.local'),
    path.join(__dirname, '../../.env'),
    path.join(__dirname, '../../.env.local'),
]);

/**
 * The WxWork message template
 */
export const msgTemplate = [
    '📣 I18N Notice',
    'You have a new translation task, please handle it promptly',
    '--------------------',
    '✦ Project: {{projectName}}',
    '✦ Deadline: {{deadline}}',
    '✦ Job Name: {{jobName}}',
    '✦ Job Link: {{jobLink}}',
    '--------------------',
].join('\n');
