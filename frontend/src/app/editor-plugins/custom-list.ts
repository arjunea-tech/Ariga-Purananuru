import EditorjsList from '@editorjs/list';
import { ToolboxConfig } from '@editorjs/editorjs';
import { MenuConfigItem } from '@editorjs/editorjs/types/tools';

export class CustomList extends EditorjsList {
  static override get toolbox(): ToolboxConfig {
    const defaultToolbox = EditorjsList.toolbox;
    if (Array.isArray(defaultToolbox)) {
      return defaultToolbox.filter((item: any) => item.data?.style !== 'checklist');
    }
    return defaultToolbox;
  }

  override renderSettings(): MenuConfigItem[] {
    const defaultSettings = super.renderSettings();
    if (Array.isArray(defaultSettings)) {
      const api = (this as any).api;
      return defaultSettings.filter((item: any) => {
        const label = item.label || '';
        return label !== 'Checklist' && label !== api.i18n.t('Checklist');
      });
    }
    return defaultSettings;
  }
}
