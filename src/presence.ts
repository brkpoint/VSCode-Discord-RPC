import * as vscode from 'vscode';
import { Activity, ActivityType } from './discord';
import { ExtensionData } from './data';
import { WorkspaceData } from './workspace';

export namespace Presence {
    export function createActivityFromData(startTimestamp: number): Activity {
        const activity = new Activity(
            ExtensionData.getActivityName(),
            ActivityType.PLAYING,
        ).setLargeImage('vscode');

        if (ExtensionData.isInActivityStealthMode()) {
            return activity;
        }

        if (WorkspaceData.isIdle()) {
            activity
                .setTitle(ExtensionData.getActivityIdleTitleText())
                .setDescription(ExtensionData.getActivityIdleDescriptionText())
                .setLargeImageText('Idle...');

            return activity;
        }

        const title = ExtensionData.getActivityTitleText();
        const description = ExtensionData.getActivityDescriptionText();
        const icon = WorkspaceData.getIconId();

        activity
            .setTitle(title)
            .setDescription(description)
            .setLargeImage(icon)
            .setLargeImageText('Editing...');

        return activity;
    }
}
