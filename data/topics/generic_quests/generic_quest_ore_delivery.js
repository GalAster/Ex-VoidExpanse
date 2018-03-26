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
        topic.AddPhrase("We need 150 pieces of %destDesc%. I will pay %destGold% , which is much more than you'll get in a store for that amount.", {destDesc: destinationDesc, destGold: destinationGold});
	topic.AddPhrase($p0006); // By the way, if your cargo space is lower than 150, just transfer the ore you have into Station Storage. I can also take the ore from there. Then you can gather more.

        topic.QuestStart(TOPIC_ID, $q0001, true); // Ore supply
        topic.QuestAddLog(TOPIC_ID, "I need to get 150 pieces of %destDesc% to station %destBase% in the %destSystem% system.", {destDesc: destinationDesc, 
		destBase: destinationBase, destSystem: destinationSystem});
	topic.QuestAddLog(TOPIC_ID, $q0003); // If my cargo space is not large enough, I can store the ore in the station's storage bay. The station commander will take the ore from there.
        topic.QuestAddMark(TOPIC_ID, destinationSystem);
        topic.QuestAddLocalMarkObject(TOPIC_ID, destinationSystem, destinationBase, destinationType, destinationDesc, destinationExp, destinationGold);
        topic.QuestSetCancelHandler(TOPIC_ID, "OnCancel");

        topic.SetState(100);
    }
    else if (state == 100)
    {
        var npc_id = topic.GetCurrentNpcShipId();
        var currentBase = ship.GetCurrentBase(npc_id);

        if (currentBase == destinationBase)
        {
            //check if player has specified amount
            var hasCargo = ship.HasCargoAmount(PLAYER_SHIP, destinationType, 150);
            if (!hasCargo)
            {
            	topic.AddPhrase("I thought we had a deal. I need no less than 150 pieces.  You can count, I assume? Come back when you've gothered enough %destDesc%.", {destDesc: destinationDesc});
	    }
            else
            {
                topic.AddPhrase($p0004); // Good job! Now we can finally complete our repairs. Here is your money.
                ship.RemoveCargoByType(PLAYER_SHIP, destinationType, 150);

                GQL.AddReward(PLAYER, destinationSystem, destinationBase, destinationType, destinationDesc, destinationExp, destinationGold);

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