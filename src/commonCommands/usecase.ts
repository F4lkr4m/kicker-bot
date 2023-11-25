import { selectOne } from "@utils/selectOne";
import { compose } from "rambda";

const MIN_PLAYERS_FOR_ROLL = 4;

export interface CommonCommandsUsecaseType {
    help: () => string;
    rollPairs: (playersMessage: string) => string;
}

export class CommonCommandsUsecase implements CommonCommandsUsecaseType {
    constructor() {}

    help = () => {
        const helpText = `\
        Чак Норрис на связи!\n
        Прочитай эту инструкцию и сможешь как я - делать шпагат на двух летящих самолетах ;)\n
        /roll {names} - произвести выбор двух пар из введенных игроков, names - имена игроков, через пробел, минимум - 4 игрока
        /create - создать комнату для беседы
        /room - посмотреть информацию о комнате
        /add - добавиться в комнату - для старта игры нужно 2 или 4 игрока
        /start - начать игру
        /me - личная статистика
        /clear - очистить комнату
        /exit - выйти из комнаты
        /remove {names} - удалить пользователя из комнаты, names - имена игроков, через пробел
        /leaders - список лидеров за все время
        /leaders_weekly - список лидеров за неделю (с момента начала недели)
        /cancel - отменить текущую игру
        `
        return helpText;
    };


    rollPairs = (playersMessage: string) => {
        const names = playersMessage.split(' ');

        if (names.length < MIN_PLAYERS_FOR_ROLL) {
            return 'Ошибка, недостаточно игроков';
        }

        const firstRoll = compose(selectOne<string>, selectOne<string>)({ others: names, selected: [] });
        const secondRoll = compose(selectOne<string>, selectOne<string>)({ others: firstRoll.others, selected: [] });

        const msg = `1ая пара игроков - ${firstRoll.selected.join(' ')}
            \n2ая пара игроков - ${secondRoll.selected.join(' ')}
            \nМеняющиеся игроки - ${secondRoll.others.join(' ')}`;

        return msg;
    };
}