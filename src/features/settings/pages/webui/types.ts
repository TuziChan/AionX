export type WebuiInnerTab = 'service' | 'channels';

export type ChannelPluginType = 'telegram' | 'lark' | 'dingtalk' | 'slack' | 'discord';

export interface WebuiSettingsDraft {
  enabled: boolean;
  port: number;
  remote: boolean;
}

export interface ChannelPluginFormValues {
  type: ChannelPluginType;
  name: string;
  enabled: boolean;
  botToken: string;
  defaultModel: string;
  webhookUrl: string;
  appId: string;
  appSecret: string;
  appKey: string;
  signingSecret: string;
  applicationId: string;
  extraConfig: string;
}
