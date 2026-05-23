export type VideoTemplate = {
  name: string;
  desc: string;
  enabled: boolean;
};

export const videoTemplates: VideoTemplate[] = [
  {
    name: "占位视频",
    desc: "视频生成功能即将上线",
    enabled: false,
  },
];
