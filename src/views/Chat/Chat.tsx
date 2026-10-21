import { DisappearingChat } from './DisappearingChat';
import { NonDisappearingChat } from './NonDisappearingChat';
import { overlayCssVariables } from './overlayStyle';
import { TokenExpiredNotice } from './TokenExpiredNotice';
import { useChatSearchParams } from './useChatSearchParams';

import { TwitchWebSocketClient } from '../../TwitchWebSocketClient';
import { persistedStore } from '../../store/store';
import './Chat.less';

export const Chat = () => {
  const accessToken = persistedStore((s) => s.accessToken);
  const chatSearchParams = useChatSearchParams();

  return (
    <>
      {accessToken && <TwitchWebSocketClient />}
      <div
        className="chat"
        style={{
          background: chatSearchParams.backgroundColor,
          width: chatSearchParams.width,
          height: chatSearchParams.height,
          color: chatSearchParams.foregroundColor,
          fontSize: chatSearchParams.fontSize,
          fontFamily: chatSearchParams.fontFamily,
          ...overlayCssVariables(chatSearchParams),
        }}
      >
        <TokenExpiredNotice />
        {chatSearchParams.animatedExit ? <DisappearingChat /> : <NonDisappearingChat />}
      </div>
    </>
  );
};
