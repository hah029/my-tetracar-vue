import { reactive } from 'vue';
import { useTranslation } from "i18next-vue";


// основная функция реактивного перевода каждой строки в игре
export function createNewText() {
    const { t } = useTranslation();
    
    const newText = reactive({
        // получаем реактивную фразу в нужном языке (с черточками по бокам и без)
        makeText: (val_: string, type_?: string) => {
            if (type_ != undefined) {
                if (type_ == 'leftLine') {
                    // ставим только одну черточку СЛЕВА от текста
                    return `- ${t(val_)}`;
                } else if (type_ == 'rightLine') {
                    // ставим только одну черточку СПРАВА от текста
                    return `${t(val_)} -`;
                } else {
                    // не ставим черточки по бокам строки
                    return t(val_);
                }
            } else {
                // черточки ставим (у кнопок)
                return `- ${t(val_)} -`;
            };
        },

        // получаем случайный элемент из входящего массива 
        //      (если на вход поступает не строка, а целый массив строк)
        getRandomFromArray: (val_: any): any => {
            const array = t(val_, { returnObjects: true }) as any[];
            
            if (!Array.isArray(array) || array.length === 0) {
                console.warn(`Invalid array for val_: ${val_}`);
                return '';
            };
            
            const randomIndex = Math.floor(Math.random() * array.length);
            return array[randomIndex];
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