const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
require('dotenv').config(); // .env 파일 로드

// 클라이언트 초기화
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
    ],
});

const statuses = [
    '초깨비 서버에 오신것을 환영합니다',
    '초하!',
];

const logChannelId = '1302472407419850862'; // 로그를 보낼 채널 ID
const allowedGuildId = '616279871567691792'; // 특정 서버 ID

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);

    // 봇 상태 메시지 주기적으로 변경
    let index = 0;
    setInterval(() => {
        client.user.setPresence({
            activities: [{ name: statuses[index] }],
            status: 'online', // 'online', 'idle', 'dnd', 'invisible' 중 하나를 선택
        });

        // 인덱스 업데이트
        index = (index + 1) % statuses.length; // 인덱스가 상태 메시지 배열의 길이를 초과하지 않도록
    }, 10000); // 10초마다 상태 메시지 변경

    // 서버 ID 확인 후 닉네임 변경 실행
    const guild = client.guilds.cache.get(allowedGuildId);
    if (guild) {
        await setNicknamesForMembers(guild);
    } else {
        console.error('지정된 서버를 찾을 수 없습니다.');
    }
});

const excludedRoles = ['616285124740382723', '616285546322591744', '844447650198978560', '616288663646634149']; // 제외할 역할 ID를 배열로 추가
const nicknameSet = new Set(); // 중복 방지를 위한 닉네임 추적 Set

// 랜덤 6자리 숫자 생성 함수
function generateUniqueNickname() {
    let nickname;
    do {
        nickname = Math.floor(100000 + Math.random() * 900000).toString();
    } while (nicknameSet.has(nickname));
    nicknameSet.add(nickname);
    return nickname;
}

// 특정 역할을 가지고 있는지 확인하는 함수
function hasExcludedRole(member) {
    return excludedRoles.some(roleId => member.roles.cache.has(roleId));
}

// 로그 채널에 Embed 메시지 보내기
async function sendLogEmbed(member, previousNickname, newNickname) {
    const logChannel = client.channels.cache.get(logChannelId);
    if (logChannel) {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('닉네임 변경 알림')
            .setDescription(`🎉 ${member}님의 닉네임이 변경되었습니다\n이전 닉네임: **${previousNickname}**\n현재 닉네임: **${newNickname}**`)
            .setTimestamp();

        await logChannel.send({ embeds: [embed] }).catch(err => console.error(`로그 전송 실패: ${err}`));
    } else {
        console.error('로그 채널을 찾을 수 없습니다.');
    }
}

// 접속한 사용자 및 기존 사용자 닉네임 변경
async function setNicknamesForMembers(guild) {
    if (guild.id !== allowedGuildId) return; // 특정 서버가 아니면 실행하지 않음

    const members = await guild.members.fetch();
    members.forEach(member => {
        if (!member.user.bot && !hasExcludedRole(member) && !/^\d{6}$/.test(member.nickname)) {
            const previousNickname = member.nickname || member.user.username; // 이전 닉네임
            const newNickname = generateUniqueNickname();
            member.setNickname(newNickname).then(() => {
                console.log(`🎉 ${member.displayName}님의 닉네임이 ${newNickname}로 변경되었습니다!`);
                sendLogEmbed(`<@${member.id}>`, previousNickname, newNickname); // 멘션 형태로 로그
            }).catch(err => console.error(`닉네임 변경 실패: ${err}`));
        }
    });
}

// 새로운 사용자가 접속하면 닉네임 변경
client.on('guildMemberAdd', member => {
    if (member.guild.id !== allowedGuildId) return; // 특정 서버가 아니면 실행하지 않음

    if (!member.user.bot && !hasExcludedRole(member) && !/^\d{6}$/.test(member.nickname)) {
        const previousNickname = member.nickname || member.user.username; // 이전 닉네임
        const newNickname = generateUniqueNickname();
        member.setNickname(newNickname).then(() => {
            console.log(`🎉 ${member.displayName}님의 닉네임이 ${newNickname}로 변경되었습니다!`);
            sendLogEmbed(`<@${member.id}>`, previousNickname, newNickname); // 멘션 형태로 로그
        }).catch(err => console.error(`닉네임 변경 실패: ${err}`));
    }
});

client.login(process.env.TOKEN).catch(err => console.error(`로그인 실패: ${err}`));
