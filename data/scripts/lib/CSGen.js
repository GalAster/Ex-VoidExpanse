//--------------------------------------------
// Cluster System Generation
// CSGen.js
//
// Desc:
//	This small library provides an opportunity to simplify
//	the process of creation of certain types of objects
//--------------------------------------------

using(generator);

var CSGen = {
    // creates stars
    CreateGenericStars: function (args)
    {
        var res = [];

        var id = generator.AddStar(
            args.sys_id, //system
            0.0, //coordinateX
            0.0, //coordinateY
            MathExt.RandInt(), //seed
            100.0 //heat
        );

        res.push({
            id: id,
            coord: { x: 0.0, y: 0.0 },
        });
    },
    // create blackhole and special anomaly with connected
    CreateBlackHole: function (args)
    {
        var res = [];

        var id = generator.AddStar(
            args.sys_id, //system
            0.0, //coordinateX
            0.0, //coordinateY
            MathExt.RandInt(), //seed
            100.0, //heat
            "blackhole"
        );

        res.push({
            id: id,
            coord: { x: 0.0, y: 0.0 },
        });
    },
    CreateGenericPlanets: function (args, params)
    {
        var res = [];
        var bWasBelt = false;

        //maximum 8, 0 is VERY RARE occasion, mostly over 3
        var numOfPlanets = MathExt.RandInt() % 3 + MathExt.RandInt() % 3 + MathExt.RandInt() % 3;
        var curRadius = MathExt.RandInt() % 30 + 100;

        // parse params
        if (typeof (params) == "object")
        {
            //do not generate belts
            if (params.allow_belts == false)
            {
                bWasBelt = true;
            }
            if (params.min_planets > 0)
            {
                if (numOfPlanets < params.min_planets)
                {
                    numOfPlanets = params.min_planets;
                }
            }
        }

        for (var j = 0; j < numOfPlanets; j++)
        {
            if (!bWasBelt && MathExt.RandInt() % 10 == 0)
            {
                bWasBelt = true;
                var types = this.GetAsteroidTypesByPrefix(args, { rock: 1 });
                this.CreateBeltOfType(args, curRadius, types);
            }
            else
            {
                var ang = MathExt.RandDouble() * Math.PI * 2.0;
                var coord_x = curRadius * Math.cos(ang);
                var coord_y = curRadius * Math.sin(ang);

                var id = generator.AddPlanet(
                    args.sys_id,
                    coord_x,
                    coord_y,
                    "GenericPlanet",
                    MathExt.RandInt());

                res.push({
                    id: id,
                    coord: { x: coord_x, y: coord_y },
                });
            }

            curRadius += MathExt.RandInt() % 30 + 80;
        }

        return res;
    },
    CreatePlanetsWithType: function (args, xml_planet_id)
    {
        var res = [];
        var bWasBelt = false;

        //maximum 8, 0 is VERY RARE occasion, mostly over 3
        var numOfPlanets = MathExt.RandInt() % 3 + MathExt.RandInt() % 3 + MathExt.RandInt() % 3;
        var curRadius = MathExt.RandInt() % 30 + 100;

        for (var j = 0; j < numOfPlanets; j++)
        {
            if (!bWasBelt && MathExt.RandInt() % 10 == 0)
            {
                bWasBelt = true;
                var types = this.GetAsteroidTypesByPrefix(args, { rock: 1 });
                this.CreateBeltOfType(args, curRadius, types);
            }
            else
            {
                var ang = MathExt.RandDouble() * Math.PI * 2.0;
                var coord_x = curRadius * Math.cos(ang);
                var coord_y = curRadius * Math.sin(ang);

                var id;
                if (MathExt.RandInt() % 3 == 0)
                {
                    id = generator.AddPlanetWithType(
                        args.sys_id,
                        coord_x,
                        coord_y,
                        "AlienPlanet",
                        MathExt.RandInt(),
                        xml_planet_id);
                }
                else
                {
                    id = generator.AddPlanet(
                        args.sys_id,
                        coord_x,
                        coord_y,
                        "GenericPlanet",
                        MathExt.RandInt());
                }

                res.push({
                    id: id,
                    coord: { x: coord_x, y: coord_y },
                });
            }

            curRadius += MathExt.RandInt() % 30 + 80;
        }

        return res;
    },
    //create asteroids
    CreateAsteroidsByPrefixes: function (args, prefixes, cluster_amount, field_min, field_amount)
    {
        var asteroidTypesSelected = this.GetAsteroidTypesByPrefix(args, prefixes);
        var bounds = this.GetWorldBounds(args);

        //create clusters
        var density = 40;
        var num = Math.round(bounds.x / density);
        var intensity = MathExt.RandInt() % 5 + cluster_amount;
        for (var j = -num; j < num; j++)
        {
            for (var i = -num; i < num; i++)
            {
                if (MathExt.RandInt() % intensity != 0)
                {
                    continue;
                }

                var x = (i + (MathExt.RandDouble() - 0.5) * 2) * density;
                var y = (j + (MathExt.RandDouble() - 0.5) * 2) * density;
                var coords = { x: x, y: y };

                if (this.IsWithinWorldBounds(args, coords)
                    && !this.CoordInSafeZones(args, coords))
                {
                    this.CreateClusterOfType(args, asteroidTypesSelected, x, y);
                }
            }
        }

        //create fields
        var FieldCount = MathExt.RandInt() % field_amount + field_min;
        for (var j = 0; j < FieldCount; j++)
        {
            this.CreateFieldOfType(args, asteroidTypesSelected);
        }
    },
    //create mine fields
    CreateMinefields: function (args, field_min, field_amount)
    {
        //create fields
        var FieldCount = MathExt.RandInt() % field_amount + field_min;

        for (var j = 0; j < FieldCount; j++)
        {
            this.CreateMinefieldOfType(args, "mine_01");
        }
    },
    //create objects (like debris)
    CreateGenericObjects: function (args, amount)
    {
        var bounds = this.GetWorldBounds(args);
        var debrisTypes = this.GetDebrisTypes();

        var density = 50;
        var num = Math.round(bounds.x / density);
        var intensity = MathExt.RandInt() % 5 + amount;
        for (var j = -num; j < num; j++)
        {
            for (var i = -num; i < num; i++)
            {
                if (MathExt.RandInt() % intensity == 0)
                {
                    if (!this.CoordInSafeZones(args, { x: i * density, y: j * density }))
                    {
                        this.CreateDebrisField(args, debrisTypes, i, j, density);
                    }
                }
            }
        }
    },
    // Creates a cluster of asteroids of chosen type
    CreateClusterOfType: function (args, types, x, y)
    {
        var NumAsteroids = 1;
        if (MathExt.RandInt() % 10 == 0)
        {
            NumAsteroids = MathExt.RandInt() % 3 + 3;
        }

        var rad = 0;
        var ang = 0;

        for (var j = 0; j < NumAsteroids; j++)
        {
            rad += 4;
            ang = MathExt.RandDouble() * Math.PI * 2.0;

            var crd_x = x + Math.cos(ang) * rad;
            var crd_y = y + Math.sin(ang) * rad;

            if (this.CoordInSafeZones(args, { x: crd_x, y: crd_y }))
            {
                continue;
            }

            var asteroidTypeId = this.PickFromPrefixesByRandom(args, types);
            var scale = MathExt.RandDouble() * 0.8 + 0.8;
            var resQ = 1.0;

            //var rotation3d = { X: (MathExt.RandDouble()) * 90, Y: (MathExt.RandDouble()) * 90, Z: 0.0 };
            var rotation3dSpeed = this.GetRandomRotationSpeed();

            var initialAngle = MathExt.RandDouble();

// --------------------------------------------------------------------------------------------------------------------------------------

	var ssendam_random = MathExt.RandInt() % 100

	if (ssendam_random < 2)
        {
            asteroidTypeId = "ssendam_asteroid_smartmetal";
        }
        else
        {
		if (ssendam_random < 5)
        	{
        	asteroidTypeId = "ssendam_asteroid_serizonite";
        	}
        	else
        	{
			if (ssendam_random < 10)
        		{
        		asteroidTypeId = "ssendam_asteroid_valorite";
        		}
        		else
	        	{
				if (ssendam_random < 15)
        			{
        			asteroidTypeId = "ssendam_asteroid_verite";
        			}
        			else
		        	{
					if (ssendam_random < 20)
        				{
        				asteroidTypeId = "ssendam_asteroid_agapite";
        				}
        				else
			        	{
						if (ssendam_random < 25)
        					{
        					asteroidTypeId = "ssendam_asteroid_seralucite";
        					}
        					else
			        		{
							if (ssendam_random < 30)
        						{
        						asteroidTypeId = "ssendam_asteroid_mangkolite";
        						}
        						else
				        		{
								if (ssendam_random < 40)
        							{
        							asteroidTypeId = "ssendam_asteroid_fraclasite";
        							}
        							else
				        			{
									if (ssendam_random < 50)
        								{
        								asteroidTypeId = "ssendam_asteroid_cyactite";
        								}
        								else
					        			{
									asteroidTypeId = "ssendam_asteroid_glepsite";
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

            var ast_id =
                generator.AddAsteroid(
                    args.sys_id,
                    crd_x, crd_y,
                    asteroidTypeId,
                    scale,
                    resQ,
                    initialAngle,
                    //rotation3d,
                    rotation3dSpeed);
        }
    },
    // creates a cluster of asteroids of chosen type
    CreateDebrisField: function (args, types, x_pos, y_pos, mult)
    {
        var NumDebris = 2;
        if (MathExt.RandInt() % 10 < 2)
        {
            NumDebris = MathExt.RandInt() % 3 + 3;
        }

        // NumDebris *= 10;
        var CoordOfField =
            {
                y: (y_pos + MathExt.RandDouble()) * mult,
                x: (x_pos + MathExt.RandDouble()) * mult,
            };
        var rad = 0;
        var ang = 0;

        for (var j = 0; j < NumDebris; j++)
        {
            rad += 4;
            ang = MathExt.RandDouble() * Math.PI * 2.0;

            var crd_x = CoordOfField.x + Math.cos(ang) * rad;
            var crd_y = CoordOfField.y + Math.sin(ang) * rad;
            var debrisTypeID = utils.SelectRandom(types);

            generator.AddSpaceObject(args.sys_id, crd_x, crd_y, debrisTypeID, {});
        }
    },
    // creates a field of asteroids of chosen type
    CreateFieldOfType: function (args, types)
    {
        var bounds = this.GetWorldBounds(args);
        var NumAsteroids = MathExt.RandInt() % 30 + 7;

        var FieldAng = MathExt.RandDouble() * Math.PI * 2.0;
        var FieldDistance = MathExt.RandInt() % (bounds.x - 200) + 200; //from 200 to bound

        var CurAng = FieldAng;
        for (var j = 0; j < NumAsteroids; j++)
        {
            var angOffset = (MathExt.RandDouble() * 14 + 8) / FieldDistance;
            var newDist = FieldDistance + MathExt.RandDouble() * 40.0 - 20;
            CurAng += angOffset;

            var crd_x = newDist * Math.cos(CurAng);
            var crd_y = newDist * Math.sin(CurAng);

            if (!this.CoordInSafeZones(args, { x: crd_x, y: crd_y }))
            {
                var asteroidTypeId = this.PickFromPrefixesByRandom(args, types);
                var scale = MathExt.RandDouble() * 0.8 + 0.8;
                var resQ = 1.0;

                //var rotation3d = { X: (MathExt.RandDouble()) * 90, Y: (MathExt.RandDouble()) * 90, Z: 0.0 };
                var rotation3dSpeed = this.GetRandomRotationSpeed();

                var initialAngle = MathExt.RandDouble();

// --------------------------------------------------------------------------------------------------------------------------------------

	var ssendam_random = MathExt.RandInt() % 100

	if (ssendam_random < 2)
        {
            asteroidTypeId = "ssendam_asteroid_smartmetal";
        }
        else
        {
		if (ssendam_random < 5)
        	{
        	asteroidTypeId = "ssendam_asteroid_serizonite";
        	}
        	else
        	{
			if (ssendam_random < 10)
        		{
        		asteroidTypeId = "ssendam_asteroid_valorite";
        		}
        		else
	        	{
				if (ssendam_random < 15)
        			{
        			asteroidTypeId = "ssendam_asteroid_verite";
        			}
        			else
		        	{
					if (ssendam_random < 20)
        				{
        				asteroidTypeId = "ssendam_asteroid_agapite";
        				}
        				else
			        	{
						if (ssendam_random < 25)
        					{
        					asteroidTypeId = "ssendam_asteroid_seralucite";
        					}
        					else
			        		{
							if (ssendam_random < 30)
        						{
        						asteroidTypeId = "ssendam_asteroid_mangkolite";
        						}
        						else
				        		{
								if (ssendam_random < 40)
        							{
        							asteroidTypeId = "ssendam_asteroid_fraclasite";
        							}
        							else
				        			{
									if (ssendam_random < 50)
        								{
        								asteroidTypeId = "ssendam_asteroid_cyactite";
        								}
        								else
					        			{
									asteroidTypeId = "ssendam_asteroid_glepsite";
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

                var ast_id =
                    generator.AddAsteroid(
                        args.sys_id,
                        crd_x, crd_y,
                        asteroidTypeId,
                        scale,
                        resQ,
                        initialAngle,
                        //rotation3d,
                        rotation3dSpeed);
            }
        }
    },
    // creates a field of asteroids of chosen type
    CreateMinefieldOfType: function (args, debrisTypeID)
    {
        var bounds = this.GetWorldBounds(args);
        var NumMines = MathExt.RandInt() % 30 + 7;

        var FieldAng = MathExt.RandDouble() * Math.PI * 2.0;
        var FieldDistance = MathExt.RandInt() % (bounds.x - 200) + 200; //from 200 to bound

        var CurAng = FieldAng;
        for (var mineIndex = 0; mineIndex < NumMines; mineIndex++)
        {
            var angOffset = (MathExt.RandDouble() * 14 + 8) / FieldDistance;
            var newDist = FieldDistance + MathExt.RandDouble() * 40.0 - 20;
            CurAng += angOffset;

            var crd_x = newDist * Math.cos(CurAng);
            var crd_y = newDist * Math.sin(CurAng);

            if (!this.CoordInSafeZones(args, { x: crd_x, y: crd_y }))
            {
                generator.AddSpaceObject(args.sys_id, crd_x, crd_y, debrisTypeID, { class: "mine" });
            }
        }
    },
    // Desc: creates a belt of asteroids of chosen type
    CreateBeltOfType: function (args, dist, types)
    {
        var CurAng = 0;
        while (CurAng < Math.PI * 2.0)
        {
            var angOffset = (MathExt.RandDouble() * 14 + 8) / dist;
            var newDist = dist + MathExt.RandDouble() * 40.0 - 20;
            CurAng += angOffset;

            var crd_x = newDist * Math.cos(CurAng);
            var crd_y = newDist * Math.sin(CurAng);

            var asteroidTypeId = this.PickFromPrefixesByRandom(args, types);
            var scale = MathExt.RandDouble() * 0.8 + 0.8;
            var resQ = 1.0;

            //var rotation3d = { X: (MathExt.RandDouble()) * 90, Y: (MathExt.RandDouble()) * 90, Z: 0.0 };
            var rotation3dSpeed = this.GetRandomRotationSpeed();

            var initialAngle = MathExt.RandDouble();

            if (!this.CoordInSafeZones(args, { x: crd_x, y: crd_y }))
            {
		// --------------------------------------------------------------------------------------------------------------------------------------

	var ssendam_random = MathExt.RandInt() % 100

	if (ssendam_random < 2)
        {
            asteroidTypeId = "ssendam_asteroid_smartmetal";
        }
        else
        {
		if (ssendam_random < 5)
        	{
        	asteroidTypeId = "ssendam_asteroid_serizonite";
        	}
        	else
        	{
			if (ssendam_random < 10)
        		{
        		asteroidTypeId = "ssendam_asteroid_valorite";
        		}
        		else
	        	{
				if (ssendam_random < 15)
        			{
        			asteroidTypeId = "ssendam_asteroid_verite";
        			}
        			else
		        	{
					if (ssendam_random < 20)
        				{
        				asteroidTypeId = "ssendam_asteroid_agapite";
        				}
        				else
			        	{
						if (ssendam_random < 25)
        					{
        					asteroidTypeId = "ssendam_asteroid_seralucite";
        					}
        					else
			        		{
							if (ssendam_random < 30)
        						{
        						asteroidTypeId = "ssendam_asteroid_mangkolite";
        						}
        						else
				        		{
								if (ssendam_random < 40)
        							{
        							asteroidTypeId = "ssendam_asteroid_fraclasite";
        							}
        							else
				        			{
									if (ssendam_random < 50)
        								{
        								asteroidTypeId = "ssendam_asteroid_cyactite";
        								}
        								else
					        			{
									asteroidTypeId = "ssendam_asteroid_glepsite";
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

                var ast_id =
                    generator.AddAsteroid(
                        args.sys_id,
                        crd_x, crd_y,
                        asteroidTypeId,
                        scale,
                        resQ,
                        initialAngle,
                        //rotation3d,
                        rotation3dSpeed);
            }
        }
    },
    // some helpful generator functions
    GetWorldBounds: function (args)
    {
        return { x: 350, y: 350 };
    },
    GetRandomCoordWithinWorldBounds: function (args)
    {
        var bounds = this.GetWorldBounds(args);
        var min_dist_to_sun = this.GetMinDistanceToSun()

        var radX = MathExt.RandRangeDouble(min_dist_to_sun, bounds.x);
        var radY = MathExt.RandRangeDouble(min_dist_to_sun, bounds.y);

        var ang = MathExt.RandRangeDouble(0, Math.PI * 2);

        var point = {
            x: radX * Math.cos(ang),
            y: radY * Math.sin(ang)
        };

        return point;
    },
    IsWithinWorldBounds: function (args, coord)
    {
        var rad = MathExt.Vector2Length(coord, { x: 0, y: 0 });
        return rad < this.GetWorldBounds().x;
    },
    // change object {prefix => count} to {prefix => {count: , types: []}}
    GetAsteroidTypesByPrefix: function (args, prefixes)
    {
        var asteroidTypesAll = generator.GetAsteroidTypes();
        var asteroidTypesSelected = {};

        //filter only generic ones
        for (var i = 0; i < asteroidTypesAll.length; i++)
        {
            for (var pref in prefixes)
            {
                if (asteroidTypesAll[i].search(pref) > 0)
                {
                    //check if already has one
                    if (typeof (asteroidTypesSelected[pref]) == "undefined")
                    {
                        asteroidTypesSelected[pref] =
                            { types: [], count: prefixes[pref] };
                    }

                    asteroidTypesSelected[pref].types.push(asteroidTypesAll[i]);
                    break;
                }
            }
        }

        //DEBUG	
        // print all picked
        /*var str = " picked ";
         for(var kb in asteroidTypesSelected)
         {
         str += kb + "( " + asteroidTypesSelected[kb].count + " [ ";
         for(var kbb = 0; kbb < asteroidTypesSelected[kb].types.length; kbb++)
         {
         str += asteroidTypesSelected[kb].types[kbb] + ", ";
         }
         str += " ] ), ";
         }
         console.Print(str);*/

        return asteroidTypesSelected;
    },
    PickFromPrefixesByRandom: function (args, pickedTypes)
    {
        // pick prefix by chance
        var total = 0;
        var pickedPrefix;
        for (var pr in pickedTypes)
        {
            total += pickedTypes[pr].count;
        }
        var chance = MathExt.RandRange(1, total + 1);
        for (var pr in pickedTypes)
        {
            if (chance <= pickedTypes[pr].count)
            {
                pickedPrefix = pr;
                break;
            }
            chance -= pickedTypes[pr].count;
        }

        var types = pickedTypes[pickedPrefix].types;
        // now pickedPrefix is an object
        return utils.SelectRandom(types);
    },
    GetDebrisTypes: function (args)
    {
        return [
            "debris_generic_barrel_01",
            "debris_generic_barrel_02",
            "debris_generic_barrel_03",
            "debris_generic_beam_01",
            "debris_generic_pipe_01",
            "debris_generic_solarpanel_01",
            "debris_generic_transitor_01",
            "debris_generic_wreck_01"
        ];
        //return generator.GetDebrisTypes();
    },
    CoordInSafeZones: function (args, coord)
    {
        var dist;
        for (var k = 0; k < args.safe_zones_centers_x.length; k++)
        {
            dist = MathExt.Vector2Length({ x: args.safe_zones_centers_x[k], y: args.safe_zones_centers_y[k] }, coord);
            if (dist < args.safe_zones_radiuses[k])
            {
                return true;
            }
        }

        return false;
    },
    CoordInSafeZonesRad: function (args, coord, radius)
    {
        var dist;
        for (var k = 0; k < args.safe_zones_centers_x.length; k++)
        {
            dist = MathExt.Vector2Length({ x: args.safe_zones_centers_x[k], y: args.safe_zones_centers_y[k] }, coord);
            if (dist < radius)
            {
                return true;
            }
        }

        return false;
    },
    GetRandomRotationSpeed: function ()
    {
        return {
            X: (MathExt.RandDouble() * 0.5 - 1.0) * 0.25 * 90,
            Y: (MathExt.RandDouble() * 0.5 - 1.0) * 0.25 * 90,
            Z: (MathExt.RandDouble() * 0.5 - 1.0) * 0.25 * 90
        };
    },
    GetMinDistanceToSun: function ()
    {
        return 100;
    },
    CreateMiniStation: function (args, station_type, distance_min, distance_max)
    {
        if (distance_min == 0
            || typeof (distance_min) == "undefined")
        {
            // default min distance
            distance_min = 200;
        }

        if (distance_max == 0
            || typeof (distance_max) == "undefined")
        {
            // default max distance
            distance_max = 425;
        }

        var attempt = 0;
        while (attempt++ < 100)
        {
            var ang = MathExt.RandRangeDouble(0, Math.PI * 2);
            var radius = MathExt.RandRange(distance_min, distance_max);
            var coords = { x: radius * Math.cos(ang), y: radius * Math.sin(ang) };

            if (this.CoordInSafeZonesRad(args, coords, 3)
                || generator.AreThereAnyObjects(args.sys_id, coords.x, coords.y, 20))
            {
                continue;
            }

            var spobj_id = generator.AddSpecialObject(args.sys_id, coords.x, coords.y, station_type, 0);
            //console.Print("Created mini station " + station_type + " at x:" + coords.x + " y:" + coords.y);
            return spobj_id;
        }

        console.PrintError("Cannot create mini station " + station_type);
        return null;
    },
    CreateMiniStationsRandom: function (args, station_type, count_min, count_max_inclusive, distance_min, distance_max)
    {
        var count = MathExt.RandRange(count_min, count_max_inclusive + 1);
        for (var i = 0; i < count; i++)
        {
            this.CreateMiniStation(args, station_type, distance_min, distance_max);
        }
    }
};