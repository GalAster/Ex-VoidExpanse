/*

Quest "ore delivery"

Available to anyone on any space station.

*/

using(npc);
using(console);
using(player);
using(generator);
using(ship);
using(game);
using(storage);

include(GenericQuestsLib.js);

var destinationBase = 0;
var destinationSystem = 0;
var destinationType = 0;
var destinationDesc = 0;
var destinationExp = 0;
var destinationGold = 0;


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
        //if(input == 500)
        //{
        var npc_id = topic.GetCurrentNpcShipId();
        destinationSystem = ship.GetSystemID(npc_id);
        destinationBase = ship.GetCurrentBase(npc_id);
// --------------------------------------------------------------------------------------------------------------------------------------

	var Vex_level = ship.GetLevel(PLAYER_SHIP);
	var Vex_random = MathExt.RandInt() % 100

	if (Vex_random < 2)
        {
            destinationType = "Vex_ore_smartmetal";
	    destinationDesc = "SmartMetal ore";
	    destinationExp = 5250 + (level * 10);
	    destinationGold = 52500 + (level * 100);
        }
        else
        {
		if (Vex_random < 5)
        	{
        	destinationType = "ore_serizonite";
        	destinationDesc = "serizonite ore";
		destinationExp = 2100 + (level * 10);
	    	destinationGold = 21000 + (level * 100);
		}
        	else
        	{
			if (Vex_random < 10)
        		{
        		destinationType = "Vex_ore_valorite";
			destinationDesc = "valorite ore";
			destinationExp = 1575 + (level * 10);
	    		destinationGold = 15750 + (level * 100);
        		}
        		else
	        	{
				if (Vex_random < 15)
        			{
        			destinationType = "Vex_ore_verite";
				destinationDesc = "verite ore";
				destinationExp = 1050 + (level * 10);
		    		destinationGold = 10500 + (level * 100);
        			}
        			else
		        	{
					if (Vex_random < 20)
        				{
        				destinationType = "Vex_ore_agapite";
					destinationDesc = "agapite ore";
					destinationExp = 658 + (level * 10);
			    		destinationGold = 6575 + (level * 100);
        				}
        				else
			        	{
						if (Vex_random < 25)
        					{
        					destinationType = "ore_seralucite";
						destinationDesc = "seralucite ore";
						destinationExp = 525 + (level * 10);
				    		destinationGold = 5250 + (level * 100);
        					}
        					else
			        		{
							if (Vex_random < 30)
        						{
        						destinationType = "ore_mangkolite";
							destinationDesc = "mangkolite ore";
							destinationExp = 342 + (level * 10);
					    		destinationGold = 3415 + (level * 10);
        						}
        						else
				        		{
								if (Vex_random < 40)
        							{
        							destinationType = "ore_fraclasite";
								destinationDesc = "fraclasite ore";
								destinationExp = 184 + (level * 10);
						    		destinationGold = 1840 + (level * 100);
        							}
        							else
				        			{
									if (Vex_random < 50)
        								{
        								destinationType = "ore_cyactite";
									destinationDesc = "cyactite ore";
									destinationExp = 132 + (level * 10);
							    		destinationGold = 1315 + (level * 100);
        								}
        								else
					        			{
									destinationType = "ore_glepsite";
									destinationDesc = "glepsite ore";
									destinationExp = 60 + (level * 10);
							    		destinationGold = 600 + (level * 100);
			        					}
			        				}
		        				}
		        			}
	        			}
	        		}
	        	}
        	}
        }

// --------------------------------------------------------------------------------------------------------------------------------------

        var inf = generator.GetSystemByID(destinationSystem);
        var destBase = generator.GetBaseByID(destinationBase);

        topic.AddPhrase($p0001); // Some of our equipment needs repair but we don't have enough materials and our miners are working slowly because of the pirates.
        topic.AddPhrase($p0002, { money: qgold }); // We need 150 pieces of glepsite ore. I will pay %money%d, which is much more than you'll get in a store for that amount.
		topic.AddPhrase($p0006, { exp: qexp, money: qgold }); // By the way, if your cargo space is lower than 150, just drop off your ore on the station in storage. I can take the ore from there. (Exp: %exp%, money: %money%)

        topic.QuestStart(TOPIC_ID, $q0001, true); // Ore supply
        topic.QuestAddLog(TOPIC_ID, $q0002, { station: destBase.name, system: inf.name }); // I need to get 150 pieces of glepsite ore to station %station% in the %system% system.
		topic.QuestAddLog(TOPIC_ID, $q0003, { exp: qexp, money: qgold }); // If my cargo space is not big enough I can put the ore in the storage. The station commander will take the ore from there. (Exp: %exp%, money: %money%d)
        topic.QuestAddMark(TOPIC_ID, destinationSystem);
        topic.QuestAddLocalMarkObject(TOPIC_ID, destinationSystem, destinationBase);
        topic.QuestSetCancelHandler(TOPIC_ID, "OnCancel");

        topic.SetState(100);
        //}
    }
    else if (state == 100)
    {
        var npc_id = topic.GetCurrentNpcShipId();
        var currentBase = ship.GetCurrentBase(npc_id);


        if (currentBase == destinationBase)
        {
            //check if player has specified amount
            var hasCargo = ship.HasCargoAmount(PLAYER_SHIP, "ore_glepsite", 150);
            if (!hasCargo)
            {
                topic.AddPhrase($p0003); // I thought we had a deal. I need no less than 150 pieces. You can count, I assume? Come back when you gather enough glepsite.
            }
            else
            {
                topic.AddPhrase($p0004); // Good job! Now we can finally complete our repairs. Here is your money.
                ship.RemoveCargoByType(PLAYER_SHIP, "ore_glepsite", 150);

                GQL.AddReward(PLAYER, destinationSystem, qgold, qexp);

                topic.SetState(0);
                topic.QuestRemoveMarkers(TOPIC_ID);
                topic.QuestSetState(TOPIC_ID, QuestState.Finished);
                topic.QuestClearCancelHandler(TOPIC_ID, "OnCancel");
                topic.QuestRemove(TOPIC_ID);

                GQL.CompleteQuest(PLAYER_SHIP, TOPIC_ID);

                topic.RemoveTopic(TOPIC_ID);
            }
        }
        else
        {
            topic.AddPhrase($p0005); // Ore? But we don't need ore right now... Maybe you got this order on another station?
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