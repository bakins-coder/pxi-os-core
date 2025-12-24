/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { MockInstance } from 'vitest';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ideCommand } from './ideCommand.js';
import { type CommandContext } from './types.js';
import { IDE_DEFINITIONS } from '@google/gemini-cli-core';
import * as core from '@google/gemini-cli-core';
import { SettingScope } from '../../config/settings.js';

vi.mock('@google/gemini-cli-core', async (importOriginal) => {
  const original = await importOriginal<typeof core>();
  return {
    ...original,
    getOauthClient: vi.fn(original.getOauthClient),
    getIdeInstaller: vi.fn(original.getIdeInstaller),
    IdeClient: {
      getInstance: vi.fn(),
    },
  };
});

describe('ideCommand - disable subcommand', () => {
  let mockContext: CommandContext;
  let mockIdeClient: core.IdeClient;
  let platformSpy: MockInstance;

  beforeEach(() => {
    vi.resetAllMocks();

    mockIdeClient = {
      reconnect: vi.fn(),
      disconnect: vi.fn(),
      connect: vi.fn(),
      getCurrentIde: vi.fn(),
      getConnectionStatus: vi.fn(),
      getDetectedIdeDisplayName: vi.fn(),
    } as unknown as core.IdeClient;

    vi.mocked(core.IdeClient.getInstance).mockResolvedValue(mockIdeClient);
    vi.mocked(mockIdeClient.getDetectedIdeDisplayName).mockReturnValue(
      'VS Code',
    );
    vi.mocked(mockIdeClient.getCurrentIde).mockReturnValue(
      IDE_DEFINITIONS.vscode,
    );
    vi.mocked(mockIdeClient.getConnectionStatus).mockReturnValue({
      status: core.IDEConnectionStatus.Connected,
    });


    mockContext = {
      ui: {
        addItem: vi.fn(),
        clear: vi.fn(),
        setDebugMessage: vi.fn(),
        setPendingItem: vi.fn(),
        loadHistory: vi.fn(),
        toggleCorgiMode: vi.fn(),
        toggleDebugProfiler: vi.fn(),
        toggleVimEnabled: vi.fn(),
        reloadCommands: vi.fn(),
        extensionsUpdateState: new Map(),
        dispatchExtensionStateUpdate: vi.fn(),
        addConfirmUpdateExtensionRequest: vi.fn(),
        removeComponent: vi.fn(),
      },
      services: {
        settings: {
          setValue: vi.fn(),
        },
        config: {
          getIdeMode: vi.fn(),
          setIdeMode: vi.fn(),
          getUsageStatisticsEnabled: vi.fn().mockReturnValue(false),
        },
        git: undefined,
        logger: {
          log: vi.fn(),
          error: vi.fn(),
          warn: vi.fn(),
          debug: vi.fn(),
          info: vi.fn(),
          extend: vi.fn(),
        } as unknown as core.Logger,
      },
      session: {
        stats: {
          startTime: 0,
          issueCount: 0,
          commandCount: 0,
          codeGenerationCount: 0,
          editCount: 0,
          chatCount: 0,
        },
        sessionShellAllowlist: new Set(),
      },
    } as unknown as CommandContext;

    platformSpy = vi.spyOn(process, 'platform', 'get');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should disable IDE integration and return logout action', async () => {
    const command = await ideCommand();
    const disableSubcommand = command.subCommands!.find(
      (c) => c.name === 'disable',
    );
    expect(disableSubcommand).toBeDefined();

    const result = await disableSubcommand!.action!(mockContext, '');

    expect(mockIdeClient.disconnect).toHaveBeenCalledOnce();
    expect(mockContext.services.settings.setValue).toHaveBeenCalledWith(
      SettingScope.User,
      'ide.enabled',
      false,
    );
    expect(mockContext.services.config!.setIdeMode).toHaveBeenCalledWith(false);
    expect(result).toEqual({ type: 'logout' });
  });
});
