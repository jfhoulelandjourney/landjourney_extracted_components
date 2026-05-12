import { Injectable } from '@angular/core';
import type { Instance, Point } from '@nutrient-sdk/viewer';
import { loadPSPDFKit } from '../../documents/pdf-viewer/pspdfkit-loader';
import {
    ANNOTATION_CONFIGS,
    type AnnotationConfig,
    type AnnotationData,
    type AnnotationType,
} from '../annotation.types';

export interface CreateAnnotationParams {
  instance: Instance;
  pageIndex: number;
  dropPoint: Point;
  annotationData: AnnotationData;
}

@Injectable({ providedIn: 'root' })
export class AnnotationFactoryService {
  // Cached PSPDFKit module
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pspdfkitModule: any = null;

  private async getPSPDFKit() {
    if (!this.pspdfkitModule) {
      this.pspdfkitModule = await loadPSPDFKit();
    }
    return this.pspdfkitModule;
  }

  /**
   * Creates an annotation based on the provided parameters.
   * This method handles the creation of both widget and form field annotations.
   */
  async createAnnotation(
    params: CreateAnnotationParams
  ): ReturnType<Instance['create']> {
    const { instance, pageIndex, dropPoint, annotationData } = params;
    const annotationType = annotationData.type.toLowerCase() as AnnotationType;
    const annotationConfig = ANNOTATION_CONFIGS[annotationType];

    if (!annotationConfig) {
      throw new Error(`Unsupported annotation type: ${annotationData.type}`);
    }

    const { widget, formField } = await this.buildAnnotationPair({
      pageIndex,
      dropPoint,
      annotationData,
      annotationConfig,
      type: annotationType,
    });

    return instance.create([widget, formField]);
  }

  /**
   * Builds widget and form field pair with proper configuration.
   */
  private async buildAnnotationPair(params: {
    pageIndex: number;
    dropPoint: Point;
    annotationData: AnnotationData;
    annotationConfig: AnnotationConfig;
    type: AnnotationType;
  }) {
    const PSPDFKit = await this.getPSPDFKit();
    const { pageIndex, dropPoint, annotationData, annotationConfig, type } =
      params;
    const instantId = PSPDFKit.generateInstantId();
    const fieldName = `custom-${type}-${instantId}`;

    const boundingBox = await this.createBoundingBox(
      dropPoint,
      annotationData,
      annotationConfig
    );

    const widget = new PSPDFKit.Annotations.WidgetAnnotation({
      id: instantId,
      pageIndex,
      boundingBox,
      formFieldName: fieldName,
      customData: { ...annotationData, source: 'drag-and-drop' },
      backgroundColor: PSPDFKit.Color.TRANSPARENT,
      borderColor: PSPDFKit.Color.TRANSPARENT,
      ...(annotationConfig.formatScript && {
        additionalActions: {
          onFormat: new PSPDFKit.Actions.JavaScriptAction({
            script: annotationConfig.formatScript,
          }),
        },
      }),
    });

    const formField = await this.createFormField(
      annotationConfig,
      fieldName,
      instantId,
      widget.id,
      annotationData
    );

    return { widget, formField };
  }

  /**
   * Creates bounding box with proper positioning.
   */
  private async createBoundingBox(
    dropPoint: Point,
    itemData: AnnotationData,
    config: AnnotationConfig
  ) {
    const PSPDFKit = await this.getPSPDFKit();
    const width = itemData.width ?? config.width;
    const height = itemData.height ?? config.height;

    return new PSPDFKit.Geometry.Rect({
      left: Math.max(0, dropPoint.x - width / 2),
      top: Math.max(0, dropPoint.y - height / 2),
      width,
      height,
    });
  }

  /**
   * Creates appropriate form field based on configuration.
   */
  private async createFormField(
    config: AnnotationConfig,
    fieldName: string,
    instantId: string,
    widgetId: string,
    itemData: AnnotationData
  ) {
    const PSPDFKit = await this.getPSPDFKit();
    const baseParams = {
      name: fieldName,
      id: instantId,
      annotationIds: PSPDFKit.Immutable.List([widgetId]),
      readOnly: itemData.readonly ?? false,
    };

    if (config.formFieldType === 'signature') {
      return new PSPDFKit.FormFields.SignatureFormField(baseParams);
    }

    // Text field with default value
    const defaultValue = config.defaultValueExtractor?.(itemData) ?? '';
    return new PSPDFKit.FormFields.TextFormField({
      ...baseParams,
      defaultValue,
    });
  }
}
