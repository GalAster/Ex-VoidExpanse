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

var qResource = {};
var totalPrice = 0;
var totalQuantity = 0;


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
	var qexp = 450 + (level * MathExt.RandRange(18, 22));
	var qgold = 800 + (level * MathExt.RandRange(35, 40));

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

        //add quest
        var inf = generator.GetSystemByID(destinationSystem);
        var bases = game.GetSystemBases(destinationSystem);
        destinationBase = bases[0];
        var destBase = generator.GetBaseByID(destinationBase);
        topic.SetState(100);

        topic.QuestStart(TOPIC_ID, $q0001, true); // Supply goods
        topic.QuestAddMark(TOPIC_ID, destinationSystem);
        topic.QuestAddLocalMarkObject(TOPIC_ID, destinationSystem, destinationBase);
        topic.QuestSetCancelHandler(TOPIC_ID, "OnCancel");

        // pick resource (by random)
        var allResources = generator.GetAllResources();
        qResource = allResources[MathExt.RandRange(0, allResources.length)];
        totalQuantity = MathExt.RandRange(2, 6) * 100;
        totalPrice = qResource.price * totalQuantity * 2;

        if (totalPrice > 10000)
        {
            // small adjustment
            totalQuantity = Math.round(10000 / totalPrice * totalQuantity);
            totalPrice = 10000;
        }
		
		totalPrice = totalPrice + qgold;
        //console.Print("OMG! totalPrice = " + totalPrice);

        topic.AddPhrase($p0001, {
                station: destBase.name, system: inf.name, resource: qResource.name, quantity: totalQuantity
            }); // I just received an order from station %station% in the %system% system. They urgently need %resource%, a lot of it actually - about %quantity% units.

        topic.AddPhrase($p0002, { price: totalPrice, exp: qexp}); // You need to acquire these goods by yourself and then deliver them to the destination. When you arrive, talk to the Station Commander. You'll get double price for this deal, total %price%d. Now go, don't make them wait! (Exp: %exp%, money: %price%d)

        topic.QuestAddLog(TOPIC_ID, $q0002, {
                station: destBase.name, system: inf.name, quantity: totalQuantity, resource: qResource.name, price: totalPrice, exp: qexp
            }); // I need to deliver %quantity% units of %resource% to station %station% in the %system% system. (Exp: %exp%, money: %price%d)

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
            topic.AddPhrase($p0003); // I already gave you a job. Now go and do what you have to do.
        }
        else if (sys_id != destinationSystem)
        {
            topic.AddPhrase($p0004); // Hmmm... I'm not expecting a supply... Let me take a look at your contract.
            topic.AddPhrase($p0005, { station: destBase.name, system: inf.name }); // Right, it's not for me. The label on this package clearly says: %station% in %system%. You should go there instead of bothering me.
        }
        else if (base_id != destinationBase)
        {
            topic.AddPhrase($p0006, { station: destBase.name }); // Wrong station, my friend. Your package is expected on %station%.
        }
        else
        {
            var hasCargo = ship.HasCargoAmount(PLAYER_SHIP, qResource.id, totalQuantity);
            if (hasCargo)
            {
				topic.AddPhrase($p0007); // You've done it! You're our savior! Thank you.
                topic.AddPhrase($p0008); // Here's your reward - much more then you'd get from a store. And my eternal gratitude, of course.

                ship.RemoveCargoByType(PLAYER_SHIP, qResource.id, totalQuantity);
                GQL.AddReward(PLAYER, destinationSystem, 0, qexp);
                player.AddMoney(PLAYER, totalPrice);
				//console.Print("OMG! totalPrice = " + totalPrice);

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
            else
            {
                topic.AddPhrase($p0009, {
                        resource: qResource.name, quantity: totalQuantity
                    }); // You don't have enough of %resource%. I need no less then %quantity%. Come back when you have more.
            }
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