/**
 * 文件名: api_endpoints.ts
 * 作者: wuhao
 * 日期: 2026-04-16 10:41:41
 * 描述: 客户端后端接口路径表, 统一维护所有 API path.
 */

export class ApiEndpoints {
  static readonly auth_login = '/api/auth/login'
  static readonly auth_register = '/api/auth/register'
  static readonly auth_logout = '/api/auth/logout'

  static readonly agent_chat = '/api/agent/chat'

  static readonly ai_generate_image = '/api/ai/image'
  static readonly ai_generate_image_to_image = '/api/ai/image_to_image'
  static readonly ai_generate_music = '/api/ai/music'
  static readonly ai_generate_video = '/api/ai/video'
  static readonly ai_generate_comfyui = '/api/ai/comfyui/generate'
  static readonly ai_generate_report = '/api/ai/report/generate'

  static readonly agent_management_list = '/api/agent/management/list'
  static readonly agent_management_register = '/api/agent/management/register'
  static readonly agent_management_toggle = '/api/agent/management/toggle'
  static readonly agent_management_check = '/api/agent/management/check'

  static readonly system_feedback_submit = '/api/system/feedback/submit'

  static readonly tools_md_to_pdf = '/api/tools/md_to_pdf'
  static readonly tools_compress_image = '/api/tools/compress_image'
  static readonly tools_compress_zip = '/api/tools/compress_zip'
  static readonly tools_convert_image = '/api/tools/convert_image'

  static readonly admin_knowledge_base_demo_create = '/api/admin/knowledge_base/demo_create'
  static readonly admin_knowledge_base_categories = '/api/admin/knowledge_base/categories'
  static readonly admin_knowledge_base_indices = '/api/admin/knowledge_base/indices'

  static admin_knowledge_base_index_files(index_id: string) {
    return `/api/admin/knowledge_base/indices/${encodeURIComponent(index_id)}/files`
  }

  static readonly client_update = '/api/client/update'
}
