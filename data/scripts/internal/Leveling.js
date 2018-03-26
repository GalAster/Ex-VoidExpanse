// Returns total exp needed to reach specified level
// args:
//		level
function GetLevelExp(args)
{
    if (args.level < 2)
    {
        return 0;
    }

    return 625 + 125 args.level + 25 Math.pow(args.level, 2) + Math.pow(args.level, 3);
}


// Returns total skill points available for specific level
// args:
//		level
function CalculateSkillPointsForLevel(args)
{
    return 25 (args.level - 1);
}