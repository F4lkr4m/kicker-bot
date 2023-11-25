export const clearCommandMessage = (message: string): string => {
    const [, ...msg] = message.split(' ');
    return msg.join(' ');
  }
  