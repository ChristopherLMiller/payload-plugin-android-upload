'use client'

import {
  Form,
  FormSubmit,
  RenderFields,
  useConfig,
  useServerFunctions,
  useTranslation,
} from '@payloadcms/ui'
import type { FormState, SanitizedDocumentPermissions } from 'payload'
import type { DocumentPreferences } from 'payload'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

type ShareUploadFormProps = {
  collectionSlug: string
  docPermissions: SanitizedDocumentPermissions
  docPreferences: DocumentPreferences
  initialState: FormState
  redirectPath: string
}

export const ShareUploadForm: React.FC<ShareUploadFormProps> = ({
  collectionSlug,
  docPermissions,
  docPreferences,
  initialState,
  redirectPath,
}) => {
  const {
    config: {
      routes: { api: apiRoute },
    },
    getEntityConfig,
  } = useConfig()
  const { getFormState } = useServerFunctions()
  const { t } = useTranslation()
  const collectionConfig = getEntityConfig({ collectionSlug })

  const onChange = React.useCallback(
    async ({
      formState: prevFormState,
      submitted,
    }: {
      formState: FormState
      submitted?: boolean
    }) => {
      const response = await getFormState({
        collectionSlug,
        docPermissions,
        docPreferences,
        formState: prevFormState,
        operation: 'create',
        schemaPath: collectionSlug,
        skipClientConfigAuth: true,
        skipValidation: !submitted,
      })

      if (response && 'state' in response && response.state) {
        return response.state
      }

      return prevFormState
    },
    [collectionSlug, docPermissions, docPreferences, getFormState],
  )

  if (!collectionConfig) {
    return null
  }

  return (
    <Form
      action={formatAdminURL({
        apiRoute,
        path: `/${collectionSlug}`,
      })}
      className="mobile-upload-form"
      initialState={initialState}
      method="POST"
      onChange={[onChange]}
      redirect={redirectPath}
      validationOperation="create"
    >
      <RenderFields
        fields={collectionConfig.fields}
        forceRender={true}
        parentIndexPath=""
        parentPath=""
        parentSchemaPath={collectionSlug}
        permissions={docPermissions?.fields ?? true}
        readOnly={false}
      />
      <FormSubmit size="large">{t('general:create')}</FormSubmit>
    </Form>
  )
}
