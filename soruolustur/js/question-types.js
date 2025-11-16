/**
 * Question Types Module
 * Manages default and custom question types
 */

import StorageManager from './storage.js';

/**
 * Default Question Types (Turkish & English)
 */
export const DEFAULT_QUESTION_TYPES = [
    {
        id: 'factual',
        name: 'Olgusal',
        nameEn: 'Factual',
        description: 'Belirli bilgiler arayan doğrudan sorular',
        descriptionEn: 'Direct questions seeking specific information',
        example: 'X nedir? / What is X?',
        color: 'blue'
    },
    {
        id: 'conceptual',
        name: 'Kavramsal',
        nameEn: 'Conceptual',
        description: 'Fikirleri veya ilkeleri keşfeden sorular',
        descriptionEn: 'Questions exploring ideas or principles',
        example: 'X neden önemlidir? / Why is X important?',
        color: 'indigo'
    },
    {
        id: 'contextual',
        name: 'Bağlamsal',
        nameEn: 'Contextual',
        description: 'Daha geniş bağlam hakkında sorular',
        descriptionEn: 'Questions about broader context',
        example: 'X hangi bağlamda belirtilmiştir? / In what context is X mentioned?',
        color: 'purple'
    },
    {
        id: 'causal',
        name: 'Nedensel',
        nameEn: 'Causal',
        description: 'Nedenler veya sebeplerle ilgili sorular',
        descriptionEn: 'Questions about reasons or causes',
        example: 'X\'in nedeni nedir? / What causes X?',
        color: 'pink'
    },
    {
        id: 'procedural',
        name: 'Süreçsel',
        nameEn: 'Procedural',
        description: 'Süreçler veya adımlar hakkında sorular',
        descriptionEn: 'Questions about processes or steps',
        example: 'X nasıl gerçekleşir? / How is X achieved?',
        color: 'red'
    },
    {
        id: 'analytical',
        name: 'Analitik',
        nameEn: 'Analytical',
        description: 'Öğeleri karşılaştırma veya değerlendirme',
        descriptionEn: 'Comparing or evaluating elements',
        example: 'X ile Y nasıl karşılaştırılır? / How does X compare to Y?',
        color: 'orange'
    },
    {
        id: 'hypothetical',
        name: 'Varsayımsal',
        nameEn: 'Hypothetical',
        description: 'Hayali senaryolara dayalı sorular',
        descriptionEn: 'Questions based on imagined scenarios',
        example: 'X olsaydı ne olurdu? / What would happen if X?',
        color: 'yellow'
    },
    {
        id: 'reflective',
        name: 'Yansıtıcı',
        nameEn: 'Reflective',
        description: 'Çıkarımlar hakkında sorular',
        descriptionEn: 'Questions about implications',
        example: 'X\'in sonuçları nelerdir? / What are the implications of X?',
        color: 'green'
    },
    {
        id: 'speculative',
        name: 'Spekülatif',
        nameEn: 'Speculative',
        description: 'Görüş temelli sorular',
        descriptionEn: 'Opinion-based questions',
        example: 'Birisi X konusunda neden farklı düşünebilir? / Why might someone disagree about X?',
        color: 'teal'
    },
    {
        id: 'listing',
        name: 'Listeleme',
        nameEn: 'Listing',
        description: 'Liste isteyen sorular',
        descriptionEn: 'Questions asking for lists',
        example: 'X\'in temel unsurları nelerdir? / What are the key elements of X?',
        color: 'cyan'
    },
    {
        id: 'summarizing',
        name: 'Özetleme',
        nameEn: 'Summarizing',
        description: 'Özetler için sorular',
        descriptionEn: 'Questions for summaries',
        example: 'X\'in ana çıkarımı nedir? / What is the main takeaway from X?',
        color: 'gray'
    }
];

/**
 * Question Types Manager Class
 */
export class QuestionTypesManager {
    constructor() {
        this.defaultTypes = DEFAULT_QUESTION_TYPES;
        this.customTypes = StorageManager.loadCustomTypes();
    }

    /**
     * Get all question types (default + custom)
     */
    getAllTypes() {
        return [...this.defaultTypes, ...this.customTypes];
    }

    /**
     * Get default types only
     */
    getDefaultTypes() {
        return this.defaultTypes;
    }

    /**
     * Get custom types only
     */
    getCustomTypes() {
        return this.customTypes;
    }

    /**
     * Get type by ID
     */
    getTypeById(id) {
        return this.getAllTypes().find(type => type.id === id);
    }

    /**
     * Add custom question type
     */
    addCustomType(typeData) {
        // Generate unique ID
        const id = 'custom_' + Date.now();

        const newType = {
            id,
            name: typeData.name,
            nameEn: typeData.nameEn,
            description: typeData.description,
            example: typeData.example,
            color: typeData.color || 'gray',
            isCustom: true
        };

        this.customTypes.push(newType);
        StorageManager.saveCustomTypes(this.customTypes);

        return newType;
    }

    /**
     * Update custom question type
     */
    updateCustomType(id, typeData) {
        const index = this.customTypes.findIndex(type => type.id === id);

        if (index === -1) {
            return false;
        }

        this.customTypes[index] = {
            ...this.customTypes[index],
            ...typeData,
            id, // Preserve ID
            isCustom: true // Preserve custom flag
        };

        StorageManager.saveCustomTypes(this.customTypes);
        return true;
    }

    /**
     * Delete custom question type
     */
    deleteCustomType(id) {
        const index = this.customTypes.findIndex(type => type.id === id);

        if (index === -1) {
            return false;
        }

        this.customTypes.splice(index, 1);
        StorageManager.saveCustomTypes(this.customTypes);
        return true;
    }

    /**
     * Check if type is custom
     */
    isCustomType(id) {
        return id.startsWith('custom_');
    }

    /**
     * Get types for prompt (selected types only)
     */
    getTypesForPrompt(selectedIds) {
        if (!selectedIds || selectedIds.length === 0) {
            // If none selected, use all default types
            return this.defaultTypes.map(type => ({
                name: type.name,
                nameEn: type.nameEn,
                description: type.description
            }));
        }

        return this.getAllTypes()
            .filter(type => selectedIds.includes(type.id))
            .map(type => ({
                name: type.name,
                nameEn: type.nameEn,
                description: type.description
            }));
    }

    /**
     * Get type names for display
     */
    getTypeNames(selectedIds, language = 'tr') {
        const types = selectedIds && selectedIds.length > 0
            ? this.getAllTypes().filter(type => selectedIds.includes(type.id))
            : this.defaultTypes;

        return types.map(type => language === 'tr' ? type.name : type.nameEn);
    }

    /**
     * Validate question type data
     */
    validateTypeData(typeData) {
        const errors = [];

        if (!typeData.name || typeData.name.trim() === '') {
            errors.push('Türkçe tip adı gereklidir');
        }

        if (!typeData.nameEn || typeData.nameEn.trim() === '') {
            errors.push('İngilizce tip adı gereklidir');
        }

        if (!typeData.description || typeData.description.trim() === '') {
            errors.push('Açıklama gereklidir');
        }

        if (!typeData.example || typeData.example.trim() === '') {
            errors.push('Örnek soru gereklidir');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Get color for type (for UI)
     */
    getTypeColor(id) {
        const type = this.getTypeById(id);
        return type ? type.color : 'gray';
    }

    /**
     * Reset custom types (delete all)
     */
    resetCustomTypes() {
        this.customTypes = [];
        StorageManager.saveCustomTypes(this.customTypes);
    }

    /**
     * Export custom types (JSON)
     */
    exportCustomTypes() {
        return JSON.stringify(this.customTypes, null, 2);
    }

    /**
     * Import custom types (JSON)
     */
    importCustomTypes(jsonData) {
        try {
            const types = JSON.parse(jsonData);

            if (!Array.isArray(types)) {
                return { success: false, error: 'Geçersiz format' };
            }

            // Validate each type
            for (const type of types) {
                const validation = this.validateTypeData(type);
                if (!validation.isValid) {
                    return { success: false, error: validation.errors.join(', ') };
                }
            }

            this.customTypes = types;
            StorageManager.saveCustomTypes(this.customTypes);

            return { success: true };
        } catch (error) {
            return { success: false, error: 'JSON parse hatası' };
        }
    }

    /**
     * Get statistics about question types
     */
    getStatistics() {
        return {
            total: this.getAllTypes().length,
            default: this.defaultTypes.length,
            custom: this.customTypes.length
        };
    }
}

// Export singleton instance
export default new QuestionTypesManager();
