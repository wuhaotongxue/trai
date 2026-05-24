/**
 * 文件名: api_endpoints.ts
 * 作者: wuhao
 * 日期: 2026-04-16 10:41:41
 * 描述: 客户端后端接口路径表, 统一维护所有 API path.
 */

export class ApiEndpoints {
  static readonly api_prefix = '/api_trai/v1'

  static readonly auth_login = `${ApiEndpoints.api_prefix}/auth/login`
  static readonly auth_wecom_url = `${ApiEndpoints.api_prefix}/auth/wecom/url`
  static readonly auth_me = `${ApiEndpoints.api_prefix}/auth/me`
  static readonly auth_refresh = `${ApiEndpoints.api_prefix}/auth/refresh`
  static readonly auth_register = `${ApiEndpoints.api_prefix}/auth/register`
  static readonly auth_logout = `${ApiEndpoints.api_prefix}/auth/logout`
  static readonly auth_password_change = `${ApiEndpoints.api_prefix}/auth/password/change`

  static readonly agent_chat = `${ApiEndpoints.api_prefix}/agent/chat`

  static readonly ai_generate_image = `${ApiEndpoints.api_prefix}/ai/image`
  static readonly ai_generate_image_to_image = `${ApiEndpoints.api_prefix}/ai/image_to_image`
  static readonly ai_generate_music = `${ApiEndpoints.api_prefix}/ai/music`
  static readonly ai_generate_video = `${ApiEndpoints.api_prefix}/ai/video`
  static readonly ai_generate_comfyui = `${ApiEndpoints.api_prefix}/ai/comfyui/generate`
  static readonly ai_generate_report = `${ApiEndpoints.api_prefix}/ai/report/generate`

  static readonly agent_management_list = `${ApiEndpoints.api_prefix}/agent/management/list`
  static readonly agent_management_register = `${ApiEndpoints.api_prefix}/agent/management/register`
  static readonly agent_management_update = `${ApiEndpoints.api_prefix}/agent/management/update`
  static readonly agent_management_toggle = `${ApiEndpoints.api_prefix}/agent/management/toggle`
  static readonly agent_management_check = `${ApiEndpoints.api_prefix}/agent/management/check`

  static readonly system_feedback_submit = `${ApiEndpoints.api_prefix}/system/feedback/submit`

  static readonly tools_md_to_pdf = `${ApiEndpoints.api_prefix}/tools/md_to_pdf`
  static readonly tools_compress_image = `${ApiEndpoints.api_prefix}/tools/compress_image`
  static readonly tools_compress_zip = `${ApiEndpoints.api_prefix}/tools/compress_zip`
  static readonly tools_convert_image = `${ApiEndpoints.api_prefix}/tools/convert_image`
  static readonly tools_word_to_pdf = `${ApiEndpoints.api_prefix}/tools/word_to_pdf`
  static readonly tools_pdf_to_word = `${ApiEndpoints.api_prefix}/tools/pdf_to_word`
  static readonly tools_convert_excel = `${ApiEndpoints.api_prefix}/tools/convert_excel`

  static readonly admin_knowledge_base_demo_create = `${ApiEndpoints.api_prefix}/admin/knowledge_base/demo_create`
  static readonly admin_knowledge_base_categories = `${ApiEndpoints.api_prefix}/admin/knowledge_base/categories`
  static readonly admin_knowledge_base_indices = `${ApiEndpoints.api_prefix}/admin/knowledge_base/indices`
  static readonly admin_dashboard_api_usage = `${ApiEndpoints.api_prefix}/admin/dashboard/api_usage`

  static admin_knowledge_base_index_files(index_id: string) {
    return `${ApiEndpoints.api_prefix}/admin/knowledge_base/indices/${encodeURIComponent(index_id)}/files`
  }

  static admin_knowledge_base_index(index_id: string) {
    return `${ApiEndpoints.api_prefix}/admin/knowledge_base/indices/${encodeURIComponent(index_id)}`
  }

  static admin_knowledge_base_index_file(index_id: string, file_id: string) {
    return `${ApiEndpoints.api_prefix}/admin/knowledge_base/indices/${encodeURIComponent(index_id)}/files/${encodeURIComponent(file_id)}`
  }

  static admin_knowledge_base_upload_text(index_id: string) {
    return `${ApiEndpoints.api_prefix}/admin/knowledge_base/indices/${encodeURIComponent(index_id)}/files/upload_text`
  }

  static readonly client_update = `${ApiEndpoints.api_prefix}/client/update`

  static readonly i18n_public = `${ApiEndpoints.api_prefix}/i18n/{locale}`
}
