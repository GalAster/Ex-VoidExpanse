/*
==========================================================================
Quest "delivery"

Available to anyone on any space station.
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
var chosenType = 0;


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
	var qgold = 1500 + (level * MathExt.RandRange(35, 40));
	
    if (state == 0)
    {
        //entry point - from generic_quest_anyjob
        // if(input == 500)
        // {
        var npc_id = topic.GetCurrentNpcShipId();
        var currentSystem = ship.GetSystemID(npc_id);

        //set quest variables
        destinationSystem = GetFirstFriendlySystem(currentSystem, 1);
        npcGaveQuest = npc_id;
        chosenType = MathExt.RandRange(0, 3); //randomize reason

        //add quest
        var inf = generator.GetSystemByID(destinationSystem);
        var bases = game.GetSystemBases(destinationSystem);
        destinationBase = bases[0];
        var destBase = generator.GetBaseByID(destinationBase);
        topic.SetState(100);

        topic.QuestStart(TOPIC_ID, $q0001, true); // Package delivery
        topic.QuestAddMark(TOPIC_ID, destinationSystem);
        topic.QuestAddLocalMarkObject(TOPIC_ID, destinationSystem, destinationBase);
        topic.QuestSetCancelHandler(TOPIC_ID, "OnCancel");
        if (chosenType == 0)
        {
            topic.AddPhrase($p0001, { station: destBase.name, system: inf.name }); // There are problems with the oxygen generator on station %station% in the %system% system. They've requested repair parts, and we have some. You just need to deliver them. Got it?
            topic.QuestAddLog(TOPIC_ID, $q0002, { station: destBase.name, system: inf.name, exp: qexp, money: qgold }); // I need to deliver repair parts for the oxygen generator to station %station% in the %system% system. (Exp: %exp%, money: %money%d)
        }
        else if (chosenType == 1)
        {
            topic.AddPhrase($p0002, { station: destBase.name, system: inf.name }); // There's been another alien virus attack, on station %station% in the %system% system. Similar virus attacks happen all the time across the Far Colonies. We don't know yet how the aliens are spreading their virus, but Order scientists have managed to create an antidote. We have some left since our own outbreak, you just need to deliver it to the infested station. Got it?
            topic.QuestAddLog(TOPIC_ID, $q0003, { station: destBase.name, system: inf.name, exp: qexp, money: qgold }); // I need to deliver the antidote for the alien virus to station %station% in the %system% system as soon as possible. (Exp: %exp%, money: %money%d)
        }
        else if (chosenType == 2)
        {
            topic.AddPhrase($p0003, { station: destBase.name, system: inf.name }); // This is a mission of crucial importance. I've got an encrypted message for the commander of station %station% in the %system% system. You just need to deliver it, got it? And don't even think of opening it. It's encrypted anyway!
            topic.QuestAddLog(TOPIC_ID, $q0004, { station: destBase.name, system: inf.name, exp: qexp, money: qgold }); // I need to deliver the encrypted message to station %station% in the %system% system. (Exp: %exp%, money: %money%d)
        }
        // }
    }
    else if (state == 100)
    {
        var npc_id = topic.GetCurrentNpcShipId();
        var sys_id = ship.GetSystemID(npc_id);
        var base_id = ship.GetCurrentBase(npc_id);
        var inf = generator.GetSystemByID(destinationSystem);
        var destBase = generator.GetBaseByID(destinationBase);

        if (npc_id == npcGaveQuest)
        {
            topic.AddPhrase($p0004, { exp: qexp, money: qgold}); // You know how a delivery works, right? You deliver something - and then get your reward. You'll get nothing by just standing there. Go! (Exp: %exp%, money: %money%d)
        }
        else if (sys_id != destinationSystem)
        {
            topic.AddPhrase($p0005); // Hmmm... I'm not expecting a delivery... Let me take a look at the package.
            topic.AddPhrase($p0006, { station: destBase.name, system: inf.name }); // Right, it's not for me. The label on this package clearly says: %station% in %system%. You should go there.
        }
        else if (base_id != destinationBase)
        {
            topic.AddPhrase($p0007, { station: destBase.name }); // Wrong station, my friend. Your package is expected on %station%.
        }
        else
        {
            //right system and base
            if (chosenType == 0)
            {
                topic.AddPhrase($p0008); // Ah, finally! Now we can finally fix our oxygen generator and breath free! Thank you, you've saved a lot of lives today!
            }
            else if (chosenType == 1)
            {
                topic.AddPhrase($p0009); // Finally! This small vial will save a lot of lives today. You should be proud of yourself! Damn virus. If only we knew how the Xengatarn were delivering it...
            }
            else if (chosenType == 2)
            {
                topic.AddPhrase($p0010); // Encrypted message? For me? Well, this should be interesting. Thank you for delivering it so quickly, my friend!
            }

            GQL.AddReward(PLAYER, destinationSystem, qgold, qexp);

            //end quest
            topic.SetState(0);
            topic.QuestSetState(TOPIC_ID, QuestState.Finished);
            topic.QuestRemoveMarkers(TOPIC_ID);
            topic.QuestRemove(TOPIC_ID);
            topic.QuestClearCancelHandler(TOPIC_ID, "OnCancel");
            topic.RemoveTopic(TOPIC_ID);

            //remove quest from generic storage
            GQL.CompleteQuest(PLAYER_SHIP, TOPIC_ID);
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


/*
=====================================================================================
Gets friendly to player system with base. If order == 0, then get the closest,
else get the farthest one.
=====================================================================================
*/
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