/*
=========================================================================

Quest "pirate"
Spawns powerful pirate, which you need to kill.



=========================================================================
*/


using(generator);
using(npc);
using(ship);
using(relations);
using(player);
using(game);

include(GenericQuestsLib.js);
include(pickByChance.js);

var destinationBase = 0;
var destinationSystem = 0;

function OnCheckRequirements()
{
    var npc_id = topic.GetCurrentNpcShipId();
    if (npc.GetTag(npc_id, "class") == "station.commander")
    {
        return true;
    }

    return false;
}


function OnStart()
{
}


function OnDialogue()
{
    var state = topic.GetState();
    var input = topic.GetInput();
	var level = ship.GetLevel(PLAYER_SHIP);
	var qexp = 350 + (level * MathExt.RandRange(18, 22));
	var qgold = 800 + (level * MathExt.RandRange(35, 40));

    if (state == 0)
    {
        //entry point - from generic_quest_anyjob
        // if(input == 500)
        // {
        var npc_id = topic.GetCurrentNpcShipId();
        var currentSystem = ship.GetSystemID(npc_id);
        var currentBase = ship.GetCurrentBase(npc_id);
        var inf = generator.GetSystemByID(currentSystem);

        destinationBase = currentBase;
        destinationSystem = currentSystem;

        topic.AddPhrase($p0001, { exp: qexp, money: qgold }); // Okay, listen up. A pirate lieutenant was recently spotted in this system. I bet he's doing reconnaissance. We have to act swiftly. Eliminate this pirate lieutenant and come back to me for your reward. (Exp: %exp%, money: %money%)

        var pirate = SpawnPirate(destinationSystem, inf);

        topic.QuestStart(TOPIC_ID, $q0001, true); // Bounty contract
        topic.QuestSetCancelHandler(TOPIC_ID, "OnCancel");
        topic.QuestAddMark(TOPIC_ID, currentSystem);
        topic.QuestAddLocalMarkObject(TOPIC_ID, currentSystem, pirate);
        topic.QuestAddLog(TOPIC_ID, $q0002, { system: inf.name, exp: qexp, money: qgold }); // I should kill the pirate lieutenant to keep him from completing his recon mission in the %system% system. (Exp: %exp%, money: %money%)
        topic.Bind("onNpcDie", "OnPirateKilled", { ship_id: pirate });
        topic.SetState(100);
        // }
    }
    else if (state == 100)
    {
        var npc_id = topic.GetCurrentNpcShipId();
        var currentBase = ship.GetCurrentBase(npc_id);

        if (currentBase == destinationBase)
        {
            topic.AddPhrase($p0002); // Why are you still here? Don't come back until you kill the pirate. Now go!
        }
        else
        {
            topic.AddPhrase($p0003); // Bounty contract? Never heard of it. Maybe it was issued on another station?
        }
    }
    else if (state == 200)
    {
        var npc_id = topic.GetCurrentNpcShipId();
        var currentBase = ship.GetCurrentBase(npc_id);

        if (currentBase == destinationBase)
        {
            topic.AddPhrase($p0004); // Well done! This filthy pirate won't bother us anymore. Here's your reward, you've earned it!

            GQL.AddReward(PLAYER, destinationSystem, qgold, qexp);

            //end quest
            topic.SetState(0);
            topic.QuestSetState(TOPIC_ID, QuestState.Finished);
            topic.QuestRemoveMarkers(TOPIC_ID);
            topic.QuestRemove(TOPIC_ID);
            topic.QuestClearCancelHandler(TOPIC_ID, "OnCancel");
            topic.RemoveTopic(TOPIC_ID);

            GQL.CompleteQuest(PLAYER_SHIP, TOPIC_ID);
        }
        else
        {
            topic.AddPhrase($p0005); // Bounty contract? Never heard of it. Maybe it was issued on another station?
        }
    }
}


/*
=====================================================================================
Cancel handler
=====================================================================================
*/
function OnCancel(args)
{
    topic.SetState(0);
    if (topic.HasQuest(TOPIC_ID))
    {
        topic.QuestRemoveMarkers(TOPIC_ID);
        topic.QuestSetState(QuestState.Failed);
        topic.QuestRemove(TOPIC_ID);
    }
    GQL.CompleteQuest(PLAYER_SHIP, TOPIC_ID);

    topic.QuestClearCancelHandler(TOPIC_ID, "OnCancel");
    topic.RemoveTopic(TOPIC_ID);
}


function OnPirateKilled(args)
{
    topic.SetState(200);
    topic.QuestRemoveMarkers();
    topic.QuestAddLog(TOPIC_ID, $q0003); // I've killed the pirate, and now I should return to the Station Commander and collect my reward.
    topic.QuestAddLocalMarkObject(TOPIC_ID, destinationSystem, destinationBase);
}


/*
=============================================================
Spawn mighty pirate
=============================================================
*/
function SpawnPirate(sys_id, inf)
{
    var possibleNpcs = generator.GetNpcsForLevelByTags(["pirate"], inf.danger_level);
    var l = pickByChance(possibleNpcs);
    var random_type = possibleNpcs[l].xml_type;

    var ang = MathExt.RandRangeDouble(0, 3.1415 * 2);
    var coords = { x: 400 * Math.cos(ang), y: 400 * Math.sin(ang) };

    var id = generator.AddNPCShipToSystem($i0001, "RoutePatrolling", inf.danger_level, random_type, sys_id, coords.x, coords.y, { class: "pirate" }); // Pirate Lieutenant
    relations.SetShipFaction(id, "pirates");

    return id;
}