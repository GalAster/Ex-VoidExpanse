// Returns total exp needed to reach specified level
// args:
//		level
function GetLevelExp(args)
{
    if (args.level < 2)
    {
        return 0;
    }

    return 750 * (args.level - 1) + Math.pow(args.level, 3);
}


// Returns total skill points available for specific level
// args:
//		level
function CalculateSkillPointsForLevel(args)
{
    return 10 * 5 * (args.level - 1);
}