package com.whe.redis.service;

import com.whe.redis.util.JedisFactory;
import com.whe.redis.util.Page;
import com.whe.redis.util.SerializeUtils;
import com.whe.redis.util.ServerConstant;
import org.springframework.stereotype.Service;
import redis.clients.jedis.Jedis;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Created by trustme on 2017/2/12.
 * RedisListService
 */
@Service
public class ListService {
    public Long save(int db, String key, String value) {
        Jedis jedis = JedisFactory.getJedisPool().getResource();
        jedis.select(db);
        Long nx = jedis.lpushx(key, value);
        jedis.close();
        return nx;
    }
    /**
     * 根据key分页查询list类型数据
     *
     * @return Page<List<String>>
     */
    public Page<List<String>> findListPageByKey(int db, String key, int pageNo) {
        Page<List<String>> page = new Page<>();
        Jedis jedis = JedisFactory.getJedisPool().getResource();
        jedis.select(db);
        List<String> list = jedis.lrange(key, (pageNo - 1) * ServerConstant.PAGE_NUM, pageNo * ServerConstant.PAGE_NUM);
        //总数据
        page.setTotalRecord(jedis.llen(key));
        page.setPageNo(pageNo);
        page.setResults(list);
        jedis.close();
        return page;
    }

    /**
     * 根据索引更新value
     *
     * @param db    db
     * @param index index
     * @param key   key
     * @param value value
     */
    public void lSet(int db, int index, String key, String value) {
        Jedis jedis = JedisFactory.getJedisPool().getResource();
        jedis.select(db);
        jedis.lset(key, index, value);
        jedis.close();
    }


    public long lLen(int db, String key) {
        Jedis jedis = JedisFactory.getJedisPool().getResource();
        jedis.select(db);
        Long aLong = jedis.llen(key);
        jedis.close();
        return aLong;
    }

    public void lRem(int db, int index, String key) {
        Jedis jedis = JedisFactory.getJedisPool().getResource();
        jedis.select(db);
        String uuid = UUID.randomUUID().toString();
        jedis.lset(key, index, uuid);
        jedis.lrem(key, 0, uuid);
        jedis.close();
    }

    /**
     * 保存所有list数据
     *
     * @param listMap map
     */
    public void saveAllList(int db, Map<String, List<String>> listMap) {
        Jedis jedis = JedisFactory.getJedisPool().getResource();
        jedis.select(db);
        listMap.forEach((key, list) -> list.forEach(val -> jedis.lpush(key, val)));
        jedis.close();
    }


    /**
     * 序列化保存所有list数据
     *
     * @param listMap map
     */
    public void saveAllListSerialize(int db,Map<String, List<String>> listMap) {
        Jedis jedis = JedisFactory.getJedisPool().getResource();
        jedis.select(db);
        listMap.forEach((key, list) -> list.forEach(val -> jedis.lpush(key.getBytes(), SerializeUtils.serialize(val))));
        jedis.close();
    }
}
