import { reactive } from 'vue';
import { useTranslation } from "i18next-vue";


// основная функция реактивного(!) перевода каждой строки в игре
export function createNewText() {
    const { t } = useTranslation();
    
    const newText = reactive({
        makeText: (val_: string, type_?: string) => {
            if (type_ != undefined) {
                // не ставим черточки по бокам строки
                return t(val_);
            } else {
                // черточки ставим (у кнопок)
                return `- ${t(val_)} -`;
            };
        },
    });
    
    return newText;
};

// функция стирания черточек по бокам строки (если до этого они были автоматически нарисованы)
export function deleteTextLines() {

    const newText = reactive({
        correctText: (val_: string) => {
            let newString = val_.replace("- ", "");
            newString = newString.replace(" -", "");
            
            return newString;
        },
    });
    
    return newText;
};