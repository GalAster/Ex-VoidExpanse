/*
=========================================================================

Quest "save mission"
Spawns wreckage, from which you extract survivors.



=========================================================================
*/


using(generator);
using(npc);
using(ship);
using(relations);
using(player);
using(game);

include(GenericQuestsLib.js);

var destinationBase = 0;
var destinationSystem = 0;
var survivorsQuantity = 0;
var wreckId = 0;


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

        var tmp = MathExt.RandRange(0, 3);
        survivorsQuantity = MathExt.RandRange(1, 4);
        if (tmp == 0)
        {
            topic.AddPhrase($p0001); // One of our civilian transport ships was ambushed by pirates. You need to go to the crash site and look for survivors.
        }
        else if (tmp == 1)
        {
            topic.AddPhrase($p0002); // There was a large-scale battle between our patrols and pirates not too far from here. Some of our ships were destroyed, but there may be survivors.
        }
        else if (tmp == 2)
        {
            topic.AddPhrase($p0003); // Not so long ago our patrols destroyed a pirate ship smuggling slaves. We do not tolerate slavery, so it was... disabled. Some of the slaves were killed by pirates, but some of them could have survived this confrontation.
        }
        topic.AddPhrase($p0004); // Our scanners are picking up the life signs in the wreckage. You must go there and extract the survivors. Hurry, their life signs are getting weaker every moment.
        topic.AddPhrase($p0005, { exp: qexp, money: qgold}); // And be sure you have enough space for the survivors in your ship. (Exp: %exp%, money: %money%)

        wreckId = SpawnWreck(destinationSystem, inf);

        topic.QuestStart(TOPIC_ID, $q0001, true); // Save mission
        topic.QuestSetCancelHandler(TOPIC_ID, "OnCancel");
        topic.QuestAddMark(TOPIC_ID, currentSystem);
        topic.QuestAddLocalMarkObject(TOPIC_ID, currentSystem, wreckId);
        topic.QuestAddLog(TOPIC_ID, $q0002, { system: inf.name, quantity: survivorsQuantity, exp: qexp, money: qgold }); // I should go to the location of the ship's wreckage in the %system% system and save survivors. (Exp: %exp%, money: %money%d)
        topic.SetState(100);
        // }
    }
    else if (state == 100)
    {
        var npc_id = topic.GetCurrentNpcShipId();
        var currentBase = ship.GetCurrentBase(npc_id);

        if (currentBase == destinationBase)
        {
            topic.AddPhrase($p0006); // Why are you still here? Our people are dying while you are just standing there doing nothing!
        }
        else
        {
            topic.AddPhrase($p0007); // Rescue mission? Never heard of it. You probably took it on another station.
        }
    }
    else if (state == 200)
    {
        var npc_id = topic.GetCurrentNpcShipId();
        var currentBase = ship.GetCurrentBase(npc_id);

        if (currentBase == destinationBase)
        {
            topic.AddPhrase($p0008); // You've saved all of them! Good job! We'll take care of them from now on.
            topic.AddPhrase($p0009); // Here is your reward, hero!

            ship.RemoveItemByType(PLAYER_SHIP, "quest_object_passenger");

            GQL.AddReward(PLAYER, destinationSystem, qgold, qexp);

            //end quest
            topic.SetState(0);
            topic.QuestSetState(TOPIC_ID, QuestState.Finished);
            topic.QuestClearCancelHandler(TOPIC_ID, "OnCancel");
            topic.QuestRemoveMarkers(TOPIC_ID);
            topic.QuestRemove(TOPIC_ID);
            topic.RemoveTopic(TOPIC_ID);

            GQL.CompleteQuest(PLAYER_SHIP, TOPIC_ID);
        }
        else
        {
            topic.AddPhrase($p0010); // Bounty contract? Never heard of it. Maybe it was issued on another station?
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

    generator.RemoveSpecialObject(wreckId);
}


function OnSpecialObjectActivatedHandler(args)
{
    //check if there's enough place in ship's inventory
    var freeSlots = ship.GetFreeInventorySlots(PLAYER_SHIP);
    if (freeSlots < survivorsQuantity)
    {
        game.SendNotificationError(PLAYER, $n0001, $n0002, survivorsQuantity); // Not enough room: You need at least %survivorsQuantity% free slots in your inventory to place survivors.
    }
    else
    {
        for (var i = 0; i < survivorsQuantity; i++)
        {
            ship.AddItem(PLAYER_SHIP, "quest_object_passenger", 1);
        }


        topic.Unbind("onSpecialObjectActivated", "OnSpecialObjectActivatedHandler");
        topic.SetState(200);
        topic.QuestRemoveMarkers();
        topic.QuestAddLog(TOPIC_ID, $q0003); // I've rescued the survivors from the wreckage, now I need to get them back to the station safely.
        topic.QuestAddLocalMarkObject(TOPIC_ID, destinationSystem, destinationBase);
        generator.RemoveSpecialObject(args.special_object_id);
    }
}


/*
=============================================================
Spawn mighty pirate
=============================================================
*/
function SpawnWreck(sys_id, inf)
{
    var ang = MathExt.RandRangeDouble(0, 3.1415 * 4);
    var coord = { x: 350 * Math.cos(ang), y: 350 * Math.sin(ang) };

    var spobj_id = generator.AddSpecialObject(sys_id, coord.x, coord.y, "scurvy_remains", PLAYER_SHIP);
    topic.Bind("onSpecialObjectActivated", "OnSpecialObjectActivatedHandler", { special_object_id: spobj_id });
    return spobj_id;
}