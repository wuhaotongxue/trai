#!/usr/bin/env python
# 文件名: yida_form_schema_builder.py
# 作者: wuhao
# 日期: 2026_06_02_18:25:48
# 描述: 宜搭表单 Schema 构建器, 负责将考试字段映射转换为宜搭表单设计结构

from __future__ import annotations

from uuid import uuid4


class YidaFormSchemaBuilder:
    """
    宜搭表单 Schema 构建器.

    用途:
        将通用考试字段映射列表转换为宜搭 formdesign 接口可保存的 Schema 结构.
    参数:
        无.
    返回值:
        None.
    异常:
        无.
    """

    def build_schema(
        self,
        form_title: str,
        fields: list[dict[str, object]],
        description: str | None = None,
    ) -> dict[str, object]:
        """
        构建完整的宜搭表单 Schema.

        用途:
            为创建空白表单后的 Schema 保存阶段生成稳定的 superform 结构.
        参数:
            form_title: 表单标题.
            fields: 通用字段映射列表.
            description: 表单描述.
        返回值:
            dict[str, object]: 宜搭 Schema 字典.
        异常:
            无.
        """
        components = [self._build_component(field) for field in fields]
        return {
            "schemaType": "superform",
            "schemaVersion": "5.0",
            "title": self._build_i18n(form_title),
            "description": self._build_i18n(description or ""),
            "pages": [
                {
                    "uuid": self._build_node_id(prefix="page"),
                    "title": self._build_i18n(form_title),
                    "components": components,
                }
            ],
            "dataSourceList": [],
        }

    def _build_component(self, field: dict[str, object]) -> dict[str, object]:
        """
        构建单个宜搭组件定义.

        用途:
            按字段类型为宜搭表单生成匹配的组件结构和属性.
        参数:
            field: 通用字段映射对象.
        返回值:
            dict[str, object]: 单个宜搭组件定义.
        异常:
            ValueError: 当字段类型不支持时抛出.
        """
        component_name = str(field.get("type", "")).strip()
        if component_name not in {"TextField", "TextareaField", "RadioField", "CheckboxField"}:
            raise ValueError(f"暂不支持的宜搭组件类型: {component_name}")

        props = self._build_base_props(field=field)
        if component_name in {"TextField", "TextareaField"}:
            props.update(self._build_text_props(field=field, component_name=component_name))
        if component_name in {"RadioField", "CheckboxField"}:
            props.update(self._build_option_props(field=field))

        return {
            "componentName": component_name,
            "props": props,
        }

    def _build_base_props(self, field: dict[str, object]) -> dict[str, object]:
        """
        构建组件基础属性.

        用途:
            为所有表单组件补齐标签, 字段 ID, 可见性和校验等公共配置.
        参数:
            field: 通用字段映射对象.
        返回值:
            dict[str, object]: 公共属性字典.
        异常:
            无.
        """
        validation = self._build_validation(field=field)
        return {
            "__useMediator": "value",
            "__category__": "form",
            "__gridSpan": 1,
            "fieldId": self._build_field_id(field=field),
            "label": self._build_i18n(str(field.get("label", "")).strip()),
            "placeholder": self._build_i18n(str(field.get("placeholder", "")).strip()),
            "behavior": "NORMAL",
            "visibility": ["PC", "MOBILE"],
            "labelAlign": "top",
            "labelTextAlign": "left",
            "required": bool(field.get("required", False)),
            "validation": validation,
            "submittable": "ALWAYS",
            "size": "medium",
            "tips": self._build_i18n(""),
        }

    def _build_text_props(self, field: dict[str, object], component_name: str) -> dict[str, object]:
        """
        构建文本类组件属性.

        用途:
            为单行文本和多行文本组件补齐默认值, 占位符和展示细节.
        参数:
            field: 通用字段映射对象.
            component_name: 宜搭组件名称.
        返回值:
            dict[str, object]: 文本组件属性字典.
        异常:
            无.
        """
        text_value: object = ""
        if component_name == "TextField":
            text_value = self._build_i18n("")

        props: dict[str, object] = {
            "hasClear": True,
            "valueType": "custom",
            "value": text_value,
            "maxLength": 2000 if component_name == "TextareaField" else 200,
            "rows": 6 if component_name == "TextareaField" else 1,
            "isCustomStore": True,
        }
        if component_name == "TextareaField":
            props["htmlType"] = "textarea"
            props["autoHeight"] = False
            props["showEmptyRows"] = False
        return props

    def _build_option_props(self, field: dict[str, object]) -> dict[str, object]:
        """
        构建选项类组件属性.

        用途:
            为单选和多选组件补齐 dataSource 与默认展示设置.
        参数:
            field: 通用字段映射对象.
        返回值:
            dict[str, object]: 选项组件属性字典.
        异常:
            无.
        """
        options = [self._build_option_item(option) for option in list(field.get("options", []))]
        return {
            "dataSourceType": "custom",
            "dataSource": options,
            "defaultDataSource": {
                "complexType": "custom",
                "options": options,
            },
            "valueType": "custom",
            "value": [],
            "showSearch": False,
        }

    def _build_option_item(self, option: dict[str, object]) -> dict[str, object]:
        """
        构建单个选项定义.

        用途:
            将通用选项转换为宜搭 dataSource 所需的 text 和 value 结构.
        参数:
            option: 通用选项对象.
        返回值:
            dict[str, object]: 宜搭单个选项定义.
        异常:
            无.
        """
        option_label = str(option.get("label", "")).strip()
        option_value = str(option.get("value", "")).strip()
        return {
            "sid": self._build_node_id(prefix="serial"),
            "text": self._build_i18n(option_label),
            "value": option_value,
            "defaultChecked": False,
        }

    def _build_validation(self, field: dict[str, object]) -> list[dict[str, object]]:
        """
        构建字段校验配置.

        用途:
            为必填字段生成宜搭 required 校验项.
        参数:
            field: 通用字段映射对象.
        返回值:
            list[dict[str, object]]: 校验配置列表.
        异常:
            无.
        """
        if not bool(field.get("required", False)):
            return []
        return [{"type": "required"}]

    def _build_field_id(self, field: dict[str, object]) -> str:
        """
        构建字段唯一 ID.

        用途:
            将通用字段 key 映射为宜搭组件字段 ID, 便于后续表单实例写入.
        参数:
            field: 通用字段映射对象.
        返回值:
            str: 字段唯一 ID.
        异常:
            无.
        """
        component_name = str(field.get("type", "TextField")).strip()
        field_key = str(field.get("field_key", "")).strip() or self._build_node_id(prefix="field")
        normalized_component_name = component_name[:1].lower() + component_name[1:]
        return f"{normalized_component_name}_{field_key}"

    def _build_i18n(self, text: str) -> dict[str, str]:
        """
        构建宜搭 i18n 文本结构.

        用途:
            将普通文本包装成宜搭设计器要求的多语言对象.
        参数:
            text: 原始文本.
        返回值:
            dict[str, str]: i18n 文本字典.
        异常:
            无.
        """
        normalized_text = str(text).strip()
        return {
            "type": "i18n",
            "zh_CN": normalized_text,
            "en_US": normalized_text,
        }

    def _build_node_id(self, prefix: str) -> str:
        """
        生成节点唯一标识.

        用途:
            为页面, 选项和组件提供稳定且不易冲突的 ID.
        参数:
            prefix: ID 前缀.
        返回值:
            str: 节点 ID.
        异常:
            无.
        """
        return f"{prefix}_{uuid4().hex[:12]}"


__all__ = ["YidaFormSchemaBuilder"]
