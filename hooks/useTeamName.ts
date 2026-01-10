import useLocalStorage from './useLocalStorage';

const DEFAULT_TEAM_NAME = "マイチームFC";

export const useTeamName = () => {
    const [teamName, setTeamName] = useLocalStorage('teamName', DEFAULT_TEAM_NAME);

    return { teamName: teamName || DEFAULT_TEAM_NAME, setTeamName };
};