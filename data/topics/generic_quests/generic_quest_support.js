/*
==========================================================================
Quest "support" (trader escort)

Available to anyone on any space station.

Paired with npc AI: "TraderFollower" (not too tightly, just based on it's triggers)

==========================================================================
*/


using(relations);
using(npc);
using(console);
using(player);
using(generator);
using(ship);
using(game);
using(storage);

include(GenericQuestsLib.js);

var npcGaveQuest = 0;
var destinationSystem = 0;
var destinationBase = 0;
var srcSystem = 0;
var srcBase = 0;
var traderShipId = 0;

function OnCheckRequirements()
{
    var npc_id = topic.GetCurrentNpcShipId();
    var state = topic.GetState();

    if (npc.GetTag(npc_id, "class") == "station.commander" &&
        (state == 0 || npc_id == npcGaveQuest))
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
	var qexp = 400 + (level * MathExt.RandRange(18, 22));
	var qgold = 1800 + (level * MathExt.RandRange(35, 40));

    if (state == 0)
    {
		if (traderShipId != 0)
		{
			// impossible
			return;
		}
	
        //from generic_anyjob topic
        var npc_id = topic.GetCurrentNpcShipId();
        var currentSystem = ship.GetSystemID(npc_id);
        srcSystem = currentSystem;
        srcBase = ship.GetCurrentBase(npc_id);

        //set quest variables
        destinationSystem = GetFirstFriendlySystem(currentSystem, 1);
        npcGaveQuest = npc_id;

        //add quest
        var inf = generator.GetSystemByID(destinationSystem);
        var bases = game.GetSystemBases(destinationSystem);
        destinationBase = bases[0];
        var destBase = generator.GetBaseByID(destinationBase);
        topic.SetState(100);
        topic.RefreshTopics();

        traderShipId = SpawnFreighter();
		topic.Bind("onTraderArrived", "TraderArrived", { ship_id: traderShipId });
        topic.Bind("onTraderKilled", "TraderKilled", { ship_id: traderShipId });

        topic.AddPhrase($p0001, { station: destBase.name, system: inf.name }); // This job is simple. We have a freighter, loaded with very important cargo. You need to escort him to station %station% in the %system% system.
        topic.AddPhrase($p0002, { exp: qexp, money: qgold}); // Lead the way. The freighter will just follow you. Now go, time is precious! (Exp: %exp%, money: %money%d)

        topic.QuestStart(TOPIC_ID, $q0001); // Escort job
        topic.QuestAddLog(TOPIC_ID, $q0002, { station: destBase.name, system: inf.name, exp: qexp, money: qgold }); // I've accepted a job to escort a freighter with expensive cargo to station %station% in the %system% system. (Exp: %exp%, money: %money%d)
        topic.QuestAddMark(TOPIC_ID, destinationSystem);
        topic.QuestAddLocalMarkObject(TOPIC_ID, destinationSystem, destinationBase);
    }
    else if (state == 100)
    {
        topic.AddPhrase($p0003); // You got your job. The freighter is waiting for you outside this station.
    }
    else if (state == 200)
    {
        topic.AddPhrase($p0004); // You delivered the freighter in one piece! Nicely done!
        topic.AddPhrase($p0005); // Here's your reward. Try not to spend everything at once, will you?

        GQL.AddReward(PLAYER, destinationSystem, qgold, qexp);

        //end quest
        topic.SetState(0);
        topic.QuestSetState(TOPIC_ID, QuestState.Finished);
        topic.QuestRemoveMarkers(TOPIC_ID);
        topic.QuestRemove(TOPIC_ID);
        topic.RemoveTopic(TOPIC_ID);

        //remove quest from generic storage
        GQL.CompleteQuest(PLAYER_SHIP, TOPIC_ID);
    }
}


//-------------------------------------------------------------------------------------


// succeeded!
function TraderArrived(args)
{
    topic.Unbind("onTraderArrived", "TraderArrived");
    topic.Unbind("onTraderKilled", "TraderKilled");

    topic.SetState(200);
    topic.QuestRemoveMarkers(TOPIC_ID);

    topic.QuestAddMark(TOPIC_ID, srcSystem);
    topic.QuestAddLocalMarkObject(TOPIC_ID, srcSystem, srcBase);
    topic.QuestAddLog(TOPIC_ID, $q0003); // I've successfully escorted the freighter to its destination. Now I should get back to the Station Commander and collect my reward.
	
	// to be sure ship is removed
	ship.RemoveShip(traderShipId);
	traderShipId = 0;
}

// failed quest =(
function TraderKilled(args)
{
    topic.Unbind("onTraderArrived", "TraderArrived");
    topic.Unbind("onTraderKilled", "TraderKilled");

    //drop this quest
    GQL.CompleteQuest(PLAYER_SHIP, TOPIC_ID);

    topic.SetState(0);
    topic.QuestAddLog(TOPIC_ID, $q0004); // The freighter I was supposed to escort was destroyed. I've failed this mission.
    topic.QuestRemoveMarkers(TOPIC_ID);
    topic.QuestSetState(TOPIC_ID, QuestState.Failed);
    topic.QuestRemove(TOPIC_ID);
    topic.RemoveTopic(TOPIC_ID);
	
	// to be sure ship is removed
	ship.RemoveShip(traderShipId);
	traderShipId = 0;
}

// get destination system
function GetFirstFriendlySystem(currentSystem, order)
{
    var systems = generator.GetSystemsByDistanceTo(currentSystem);

    var resarr = [];
    for (var i = 0; i < systems.length; i++)
    {
        if (systems[i] != currentSystem)
        {
            var system_faction = relations.GetSystemFaction(systems[i]);
            var ship_faction = relations.GetShipFaction(PLAYER_SHIP);

            var disposition = relations.GetFactionDispositionToShip(system_faction, PLAYER_SHIP) + relations.GetFactionsRelation(system_faction, ship_faction);

            var bases = game.GetSystemBases(systems[i]);

            if (disposition >= 0 && bases.length > 0)
            {
                resarr.push(systems[i]);
            }
        }
    }

    if (order == 0)
    {
        return resarr[0];
    }
    else
    {
        return resarr[resarr.length - 1 > 3 ? 3 : resarr.length - 1];
    }
}

// spawn freighter
function SpawnFreighter()
{
    //spawn right outside of base
    var id = generator.AddNPCShipToSystem($i0001, "TraderFollower", 50, "special_human_tradership_escort", srcSystem, 100, 100, { target: PLAYER_SHIP, target_base: destinationBase }); // Freighter

    relations.SetShipFaction(id, relations.GetBaseFaction(srcBase));
    generator.DockShipToBase(id, srcBase);
    npc.LeaveBase(id);

    return id;
}