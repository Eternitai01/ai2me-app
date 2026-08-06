export type ApiKey = {
    id: string
    key_name: string
    permissions: string
    is_active: boolean
    created_at: string
    last_used: string | null
}

export type ApiKeyListResponse = {
    api_keys: ApiKey[]
    total: number
}

export type CreateApiKeyPayload = {
    key_name: string
    permissions: string
}


export type NewKeyResponse = { new_key: string }

const base = "/api/api-keys"

export const apiKeysService = {
    list: async (): Promise<ApiKeyListResponse> => {
        const response = await fetch(`${base}`, {
            credentials: 'include',
            cache: 'no-cache'
        })
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
        }
        
        return response.json()
    },

    create: async (
        payload: CreateApiKeyPayload
    ): Promise<NewKeyResponse & { api_key?: ApiKey }> => {
        const response = await fetch(`${base}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            credentials: 'include',
            cache: 'no-cache'
        })
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
        }
        
        const data = await response.json()
        return {
            new_key: (data.new_key ?? data.key ?? data.api_key ?? ""),
            api_key: data.api_key_info,
        }
    },

    revoke: async (api_key_id: string): Promise<void> => {
        const response = await fetch(`${base}/${encodeURIComponent(api_key_id)}/revoke`, {
            method: 'POST',
            credentials: 'include',
            cache: 'no-cache'
        })
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
        }
    },

    rotate: async (api_key_id: string): Promise<NewKeyResponse> => {
        const response = await fetch(`${base}/${encodeURIComponent(api_key_id)}/rotate`, {
            method: 'POST',
            credentials: 'include',
            cache: 'no-cache'
        })
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
        }
        
        const data = await response.json()
        return { new_key: (data.new_key ?? data.key ?? data.api_key ?? "") }
    },

    delete: async (api_key_id: string): Promise<void> => {
        const response = await fetch(`${base}/${encodeURIComponent(api_key_id)}`, {
            method: 'DELETE',
            credentials: 'include',
            cache: 'no-cache'
        })
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
        }
    },
}

export default apiKeysService
